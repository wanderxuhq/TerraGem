

import React, { useEffect, useRef, useState, useCallback, Component, ErrorInfo } from 'react';
import { generateChunk } from './utils/worldGen';
import { 
    COLLISION_TILES, PLACEABLE_TILES, OVERLAY_TILES, STRINGS 
} from './constants';
import { GameState, TileType, LogMessage, Tile, Recipe, Chunk, CHUNK_SIZE, Entity, Camera, Blueprint, CustomItem } from './types';
import { InventoryBar } from './components/InventoryBar';
import { OracleLog } from './components/OracleLog';
import { CraftingMenu } from './components/CraftingMenu';
import { BlueprintMenu } from './components/BlueprintMenu';
import { BackpackMenu } from './components/BackpackMenu';
import { BlueprintSaveDialog } from './components/BlueprintSaveDialog';
import { VariantEditor } from './components/VariantEditor';
import { RailEditor } from './components/RailEditor';
import { TextureManager } from './components/TextureManager';
import { generateLore } from './services/geminiService';
import { generateDefaultTextures } from './utils/textureGen';
import { BrainCircuit, Info, Save, Palette, AlertTriangle } from 'lucide-react';

// Systems Imports
import { getTile, modifyTile } from './utils/gameUtils';
import { performRecursiveCraft } from './systems/crafting';
import { updateMinecart, updateRobot } from './systems/physics';
import { attemptMine, handleInteraction, simulateNature, updateCircuit } from './systems/world';
import { renderScene } from './systems/renderer';
import { loadGame, saveGame } from './services/storage';
import { placeBlueprint, createBlueprint } from './systems/blueprints';

// Error Boundary Component
class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-4 text-center">
           <AlertTriangle size={48} className="text-red-500 mb-4" />
           <h1 className="text-xl font-bold mb-2">Something went wrong.</h1>
           <p className="text-slate-400 mb-4 text-sm max-w-md">The game crashed. This usually happens due to corrupt save data or a temporary glitch.</p>
           <div className="bg-black/30 p-2 rounded text-xs font-mono text-red-300 mb-4 max-w-lg overflow-auto">
               {this.state.error?.message}
           </div>
           <button 
             onClick={() => {
                 localStorage.clear(); 
                 window.location.reload();
             }}
             className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-bold"
           >
             Clear Save & Reload
           </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Get Language
const getLang = () => {
  if (typeof navigator === 'undefined') return 'en';
  const navLang = navigator.language.toLowerCase();
  return navLang.startsWith('zh') ? 'zh' : 'en';
};

const LANG = getLang();
const t = (key: string) => STRINGS[key]?.[LANG] || key;
const SEED = Math.floor(Math.random() * 10000);

function Game() {
  const gameStateRef = useRef<GameState>({
      chunks: {},
      player: { x: 8, y: 8, selectedItem: null, direction: 'down' },
      inventory: { [TileType.AXE]: 1, [TileType.PICKAXE]: 1 },
      seed: SEED,
      entities: [],
      customBlueprints: [],
      customItems: [],
      customTextures: {}
  });

  const [uiTrigger, setUiTrigger] = useState(0); 
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showCrafting, setShowCrafting] = useState(false);
  const [showBlueprints, setShowBlueprints] = useState(false);
  const [showBackpack, setShowBackpack] = useState(false);
  const [showTextureManager, setShowTextureManager] = useState(false);
  const [activeBlueprint, setActiveBlueprint] = useState<Blueprint | null>(null);
  
  // Texture Cache
  const textureCacheRef = useRef<Partial<Record<TileType, HTMLImageElement>>>({});

  // Editor State
  const [editingTilePos, setEditingTilePos] = useState<{x: number, y: number} | null>(null);
  const [editingRailPos, setEditingRailPos] = useState<{x: number, y: number} | null>(null);

  // Blueprint Creation State
  const [isCreatingBlueprint, setIsCreatingBlueprint] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{x: number, y: number} | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const selectionStartRef = useRef<{x: number, y: number} | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const lastTime = useRef<number>(0);
  const camera = useRef<Camera>({ x: 0, y: 0, zoom: 1 });
  const mouseWorldRef = useRef<{x: number, y: number}>({x:0, y:0});

  const addLog = useCallback((text: string, sender: 'SYSTEM' | 'ORACLE' = 'SYSTEM') => {
    setLogs(prev => [...prev.slice(-19), { id: Math.random().toString(36), text, sender, timestamp: Date.now() }]);
  }, []);

  const handleSave = () => {
      if(saveGame(gameStateRef.current)) addLog(t('save_loaded'), "SYSTEM");
  };

  // Load Custom Textures logic
  const loadTextures = useCallback(() => {
    const textures = gameStateRef.current.customTextures || {};
    Object.entries(textures).forEach(([key, base64]) => {
        if (!base64) {
            delete textureCacheRef.current[key as TileType];
            return;
        }
        if (!textureCacheRef.current[key as TileType] || textureCacheRef.current[key as TileType]!.src !== base64) {
            const img = new Image();
            img.onload = () => {
                // Invalidate all chunks to force redraw with new texture
                Object.values(gameStateRef.current.chunks).forEach((c: Chunk) => c._dirty = true);
            };
            img.onerror = () => {
                console.error(`Failed to load texture for ${key}`);
                delete textureCacheRef.current[key as TileType];
                // Force redraw fallback
                Object.values(gameStateRef.current.chunks).forEach((c: Chunk) => c._dirty = true);
            };
            img.src = base64 as string;
            textureCacheRef.current[key as TileType] = img;
        }
    });
  }, []);

  // Initialize
  useEffect(() => {
    const loadedState = loadGame();
    if (loadedState) {
        gameStateRef.current = loadedState;
        // Migration
        if (!gameStateRef.current.customItems) gameStateRef.current.customItems = [];
        if (!gameStateRef.current.customTextures) gameStateRef.current.customTextures = {};
        
        // If no custom textures exist (first load of this feature), populate defaults
        if (Object.keys(gameStateRef.current.customTextures).length === 0) {
            gameStateRef.current.customTextures = generateDefaultTextures();
        }

        loadTextures();
        addLog(t('save_loaded'), "SYSTEM");
    } else {
        const initialChunks: Record<string, Chunk> = {};
        for(let y=-1; y<=1; y++) {
            for(let x=-1; x<=1; x++) {
                initialChunks[`${x},${y}`] = generateChunk(x, y, SEED); // Pass seed if needed or rely on global
            }
        }
        gameStateRef.current.chunks = initialChunks;
        
        // Populate defaults
        gameStateRef.current.customTextures = generateDefaultTextures();
        loadTextures();

        addLog(t('welcome'));
        addLog(t('automine'));
    }
    setUiTrigger(1);
  }, [addLog, loadTextures]);

  const update = useCallback((dt: number) => {
    const state = gameStateRef.current;
    if (Math.random() < 0.1) simulateNature(state);
    
    // Chunk Generation
    const pChunkX = Math.floor(state.player.x / CHUNK_SIZE);
    const pChunkY = Math.floor(state.player.y / CHUNK_SIZE);
    for(let y = pChunkY - 1; y <= pChunkY + 1; y++) {
        for(let x = pChunkX - 1; x <= pChunkX + 1; x++) {
            const key = `${x},${y}`;
            if (!state.chunks[key]) {
                state.chunks[key] = generateChunk(x, y, state.seed);
            }
        }
    }

    // Entity Updates
    state.entities.forEach(entity => {
        if (entity.type === 'ROBOT') {
            updateRobot(state, entity, dt, () => setUiTrigger(p => p+1));
        } else if (entity.type === 'MINECART') {
            let idx = 0, idy = 0;
            if (state.player.ridingEntityId === entity.id) {
                if (keysPressed.current.has('KeyW') || keysPressed.current.has('ArrowUp')) idy = -1;
                if (keysPressed.current.has('KeyS') || keysPressed.current.has('ArrowDown')) idy = 1;
                if (keysPressed.current.has('KeyA') || keysPressed.current.has('ArrowLeft')) idx = -1;
                if (keysPressed.current.has('KeyD') || keysPressed.current.has('ArrowRight')) idx = 1;
            }
            updateMinecart(state, entity, dt, idx, idy);

            if (state.player.ridingEntityId === entity.id) {
                state.player.x = entity.x;
                state.player.y = entity.y;
            }
        }
    });

    // Player Physics (if not riding)
    if (!state.player.ridingEntityId) {
        let dx = 0; let dy = 0;
        if (keysPressed.current.has('KeyW') || keysPressed.current.has('ArrowUp')) dy = -1;
        if (keysPressed.current.has('KeyS') || keysPressed.current.has('ArrowDown')) dy = 1;
        if (keysPressed.current.has('KeyA') || keysPressed.current.has('ArrowLeft')) dx = -1;
        if (keysPressed.current.has('KeyD') || keysPressed.current.has('ArrowRight')) dx = 1;

        if (dx !== 0 || dy !== 0) {
            const speed = 5.0 * (dt / 1000);
            if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

            const proposedX = state.player.x + dx * speed;
            const proposedY = state.player.y + dy * speed;
            
            const checkCollision = (x: number, y: number) => {
                 const tile = getTile(state.chunks, Math.floor(x + 0.5), Math.floor(y + 0.5));
                 return tile && COLLISION_TILES.has(tile.type);
            };
            
            let canMoveX = true;
            let canMoveY = true;
            if (checkCollision(proposedX, state.player.y)) canMoveX = false;
            if (checkCollision(state.player.x, proposedY)) canMoveY = false;

            const isMining = keysPressed.current.has('ControlLeft') || keysPressed.current.has('ControlRight');
            if (isMining) {
                 const reach = 0.6;
                 if (!canMoveX && dx !== 0) {
                    const tx = Math.floor(state.player.x + (dx > 0 ? reach : -reach) + 0.5);
                    attemptMine(state, tx, Math.floor(state.player.y + 0.5), () => setUiTrigger(p=>p+1));
                 }
                 if (!canMoveY && dy !== 0) {
                    const ty = Math.floor(state.player.y + (dy > 0 ? reach : -reach) + 0.5);
                    attemptMine(state, Math.floor(state.player.x + 0.5), ty, () => setUiTrigger(p=>p+1));
                 }
            }

            if (canMoveX) state.player.x = proposedX;
            if (canMoveY) state.player.y = proposedY;

            if (dy < 0) state.player.direction = 'up';
            if (dy > 0) state.player.direction = 'down';
            if (dx < 0) state.player.direction = 'left';
            if (dx > 0) state.player.direction = 'right';
        }
    }
  }, []);

  useEffect(() => {
    const loop = (time: number) => {
        const dt = time - lastTime.current;
        if (dt > 0) {
             update(Math.min(dt, 50)); 
             lastTime.current = time;
        }
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                renderScene(
                    ctx, 
                    canvasRef.current, 
                    gameStateRef.current, 
                    camera.current,
                    textureCacheRef.current,
                    activeBlueprint,
                    mouseWorldRef.current,
                    selectionStart,
                    selectionEnd
                );
            }
        }
        requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [update, activeBlueprint, selectionStart, selectionEnd]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'e' || e.key === 'E') setShowCrafting(p => !p);
        if (e.key === 'b' || e.key === 'B') setShowBlueprints(p => !p);
        if (e.key === 'i' || e.key === 'I') setShowBackpack(p => !p); 
        if (e.key === 'f' || e.key === 'F') {
            const state = gameStateRef.current;
            if (state.player.ridingEntityId) {
                state.player.ridingEntityId = null;
                state.player.x += 1;
            } else {
                 const clickedEntity = state.entities.find(ent => 
                    Math.abs(ent.x - state.player.x) < 1.0 && Math.abs(ent.y - state.player.y) < 1.0 && ent.type === 'MINECART'
                );
                if (clickedEntity) {
                    state.player.ridingEntityId = clickedEntity.id;
                    state.player.x = clickedEntity.x;
                    state.player.y = clickedEntity.y;
                }
            }
        }
        if (e.key === 'Escape') {
            setShowCrafting(false);
            setShowBlueprints(false);
            setShowBackpack(false);
            setShowTextureManager(false);
            setEditingTilePos(null);
            setEditingRailPos(null);
            setActiveBlueprint(null);
            setIsCreatingBlueprint(false);
            setSelectionStart(null);
            setSelectionEnd(null);
            setShowSaveDialog(false);
            selectionStartRef.current = null;
        }
        keysPressed.current.add(e.code);
    };
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.code);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const worldX = Math.floor((e.clientX - rect.left - camera.current.x) / 48);
      const worldY = Math.floor((e.clientY - rect.top - camera.current.y) / 48);
      mouseWorldRef.current = { x: worldX, y: worldY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (!canvasRef.current || showSaveDialog || editingTilePos || editingRailPos || showTextureManager) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const worldX = Math.floor((e.clientX - rect.left - camera.current.x) / 48); 
      const worldY = Math.floor((e.clientY - rect.top - camera.current.y) / 48);
      
      const state = gameStateRef.current;

      // Handle Start Selection
      if (isCreatingBlueprint) {
          selectionStartRef.current = { x: worldX, y: worldY };
          setSelectionStart({ x: worldX, y: worldY }); 
          setSelectionEnd(null); 
          return;
      }

      const dist = Math.sqrt((worldX - state.player.x)**2 + (worldY - state.player.y)**2);
      if (dist > 8) { addLog("Too far.", "SYSTEM"); return; }

      // Handle Blueprint Placement
      if (activeBlueprint) {
          if (placeBlueprint(state, activeBlueprint, worldX, worldY)) {
              addLog(t('place_blueprint'), "SYSTEM");
              setActiveBlueprint(null); 
              setUiTrigger(p => p + 1);
          } else {
              addLog(t('missing_mats'), "SYSTEM");
          }
          return;
      }

      const selected = state.player.selectedItem;
      const tile = getTile(state.chunks, worldX, worldY);

      if (selected && (selected === TileType.MINECART || selected === TileType.ROBOT)) {
          if (state.inventory[selected]! > 0) {
               const newEntity: Entity = {
                   id: Math.random().toString(36),
                   type: selected,
                   x: worldX + 0.5,
                   y: worldY + 0.5,
                   vx: 0, vy: 0,
                   state: 'IDLE'
               };
               state.entities.push(newEntity);
               state.inventory[selected]!--;
               setUiTrigger(p => p+1);
               return;
          }
      }

      if (selected && PLACEABLE_TILES.has(selected) && state.inventory[selected]! > 0) {
          if (tile && (!COLLISION_TILES.has(tile.type) || tile.type === TileType.FLOOR)) {
               // Determine Variant based on player direction for Gates
               let variant = 0;
               let ioConfig = 30; // Default config

               // Custom Logic Item Placement
               if (selected === TileType.AND_GATE || selected === TileType.OR_GATE || selected === TileType.NOT_GATE) {
                   if (state.player.placingCustomConfig) {
                       variant = state.player.placingCustomConfig.variant; 
                       ioConfig = state.player.placingCustomConfig.ioConfig;
                   } else {
                        // Auto Rotate
                        if (state.player.direction === 'up') variant = 0;
                        if (state.player.direction === 'right') variant = 1;
                        if (state.player.direction === 'down') variant = 2;
                        if (state.player.direction === 'left') variant = 3;
                   }
               }

               // Custom Rail Item Placement
               if (selected === TileType.RAIL) {
                    if (state.player.placingCustomConfig) {
                        variant = state.player.placingCustomConfig.variant; // This holds the mask (e.g. 15 for cross)
                    }
               }
               
               // Layering Logic: If new item is Overlay, preserve the ground underneath
               let backgroundType = tile.backgroundType;
               if (OVERLAY_TILES.has(selected)) {
                   // If current tile is already an overlay...
                   if (OVERLAY_TILES.has(tile.type)) {
                       // Special case: If it's a FLOWER, allow it to become background
                       if (tile.type === TileType.FLOWER) {
                           backgroundType = TileType.FLOWER;
                       } else {
                           // For others (e.g. Rail on Rail, Wire on Wire), keep existing background
                           backgroundType = tile.backgroundType;
                       }
                   } else {
                       // Current is ground, make it background
                       backgroundType = tile.type;
                   }
               } else {
                   // Placing a full block (e.g. Floor/Wall) clears background
                   backgroundType = undefined;
               }

               modifyTile(state.chunks, worldX, worldY, t => ({ 
                   ...t, 
                   type: selected!, 
                   active: false, 
                   variant,
                   placed: true,
                   ioConfig,
                   backgroundType
                }));
               
               // Update circuit if we placed a component
               if (selected === TileType.WIRE || selected === TileType.LEVER || selected === TileType.AND_GATE || selected === TileType.OR_GATE || selected === TileType.NOT_GATE || selected === TileType.LAMP) {
                   updateCircuit(state, worldX, worldY);
               }
               
               state.inventory[selected]!--;
               setUiTrigger(p => p+1);
               return;
          }
      }
      
      // Handle Shift+Click for Editor
      if (e.shiftKey && tile) {
          if (tile.type === TileType.AND_GATE || tile.type === TileType.OR_GATE || tile.type === TileType.NOT_GATE) {
              setEditingTilePos({x: worldX, y: worldY});
              return;
          }
          if (tile.type === TileType.RAIL) {
              setEditingRailPos({x: worldX, y: worldY});
              return;
          }
      }

      handleInteraction(state, worldX, worldY, () => setUiTrigger(p => p+1), e.shiftKey);
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
      if (!canvasRef.current || showSaveDialog) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const worldX = Math.floor((e.clientX - rect.left - camera.current.x) / 48); 
      const worldY = Math.floor((e.clientY - rect.top - camera.current.y) / 48);

      // Handle End Selection
      if (isCreatingBlueprint && selectionStartRef.current) {
          setSelectionEnd({ x: worldX, y: worldY });
          setShowSaveDialog(true);
      }
  };

  const handleSaveBlueprint = (name: string) => {
      const state = gameStateRef.current;
      const start = selectionStartRef.current;
      const end = selectionEnd;

      if (start && end) {
          const newBp = createBlueprint(state, start.x, start.y, end.x, end.y, name);
          
          if (newBp.tiles.length === 0) {
              addLog(t('blueprint_empty'), "SYSTEM");
          } else {
              state.customBlueprints.push(newBp);
              saveGame(state); 
              addLog(t('blueprint_saved'), "SYSTEM");
              setShowBlueprints(true); 
          }
      }

      // Reset
      setIsCreatingBlueprint(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      setShowSaveDialog(false);
      selectionStartRef.current = null;
      setUiTrigger(p => p+1);
  };

  const handleCancelBlueprint = () => {
      setIsCreatingBlueprint(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      setShowSaveDialog(false);
      selectionStartRef.current = null;
      setUiTrigger(p => p+1);
  }

  const handleCraft = (targetRecipe: Recipe) => {
      const state = gameStateRef.current;
      if (performRecursiveCraft(targetRecipe, state.inventory)) {
          setUiTrigger(p => p + 1);
          addLog(`${t('craft_btn')} ${t(targetRecipe.output)}`);
      } else {
          addLog("Missing resources!", "SYSTEM");
      }
  };

  const handleAskOracle = async () => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    addLog(t('thinking'), "SYSTEM");
    const px = Math.floor(gameStateRef.current.player.x);
    const py = Math.floor(gameStateRef.current.player.y);
    const nearbyTiles: Tile[] = [];
    for(let y=py-2; y<=py+2; y++) {
        for(let x=px-2; x<=px+2; x++) {
            const t = getTile(gameStateRef.current.chunks, x, y);
            if(t) nearbyTiles.push(t);
        }
    }
    const lore = await generateLore({x: px, y: py}, nearbyTiles, "Day");
    addLog(lore, "ORACLE");
    setIsAiLoading(false);
  };
  
  const handleEditorSave = (ioConfig: number) => {
      if (editingTilePos) {
          modifyTile(gameStateRef.current.chunks, editingTilePos.x, editingTilePos.y, t => ({...t, ioConfig}));
          
          updateCircuit(gameStateRef.current, editingTilePos.x, editingTilePos.y);
          updateCircuit(gameStateRef.current, editingTilePos.x + 1, editingTilePos.y);
          updateCircuit(gameStateRef.current, editingTilePos.x - 1, editingTilePos.y);
          updateCircuit(gameStateRef.current, editingTilePos.x, editingTilePos.y + 1);
          updateCircuit(gameStateRef.current, editingTilePos.x, editingTilePos.y - 1);

          setEditingTilePos(null);
          setUiTrigger(p => p+1);
      }
  };

  const handleRailSave = (variant: number) => {
      if (editingRailPos) {
          modifyTile(gameStateRef.current.chunks, editingRailPos.x, editingRailPos.y, t => ({...t, variant}));
          setEditingRailPos(null);
          setUiTrigger(p => p+1);
      }
  };

  const handleEditorSaveToBackpack = (ioConfig: number, name: string) => {
      if (editingTilePos) {
          const tile = getTile(gameStateRef.current.chunks, editingTilePos.x, editingTilePos.y);
          if (tile) {
              const newItem: CustomItem = {
                  id: Math.random().toString(36).substr(2, 9),
                  name: name,
                  baseType: tile.type,
                  ioConfig,
                  variant: tile.variant
              };
              gameStateRef.current.customItems.push(newItem);
              saveGame(gameStateRef.current);
              addLog(t('custom_item_saved'), "SYSTEM");
              handleEditorSave(ioConfig);
          }
      }
  };

  const handleRailSaveToBackpack = (variant: number, name: string) => {
      if (editingRailPos) {
          const tile = getTile(gameStateRef.current.chunks, editingRailPos.x, editingRailPos.y);
          if (tile) {
              const newItem: CustomItem = {
                  id: Math.random().toString(36).substr(2, 9),
                  name: name,
                  baseType: tile.type,
                  ioConfig: 0, // Not used for rails
                  variant: variant // This stores the rail mask
              };
              gameStateRef.current.customItems.push(newItem);
              saveGame(gameStateRef.current);
              addLog(t('custom_item_saved'), "SYSTEM");
              handleRailSave(variant);
          }
      }
  };

  const getEditingTile = () => {
      if (!editingTilePos) return null;
      return getTile(gameStateRef.current.chunks, editingTilePos.x, editingTilePos.y);
  };

  const getEditingRailTile = () => {
      if (!editingRailPos) return null;
      return getTile(gameStateRef.current.chunks, editingRailPos.x, editingRailPos.y);
  };
  
  const handleUpdateTexture = (type: TileType, base64: string | null) => {
      const state = gameStateRef.current;
      if (!state.customTextures) state.customTextures = {};
      
      if (base64) {
          state.customTextures[type] = base64;
      } else {
          delete state.customTextures[type];
      }
      saveGame(state);
      loadTextures(); // Reload into image elements
      // Force full redraw
      Object.values(state.chunks).forEach((c: Chunk) => c._dirty = true);
      setUiTrigger(p => p+1);
  };

  const handleRestoreDefaults = () => {
      const defaults = generateDefaultTextures();
      gameStateRef.current.customTextures = defaults;
      saveGame(gameStateRef.current);
      loadTextures();
      Object.values(gameStateRef.current.chunks).forEach((c: Chunk) => c._dirty = true);
      setUiTrigger(p => p+1);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 select-none">
       <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="cursor-crosshair block"
      />
      
      {isCreatingBlueprint && !showSaveDialog && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-cyan-900/80 text-white px-4 py-2 rounded-full shadow-xl border border-cyan-500 animate-pulse pointer-events-none z-50">
              {selectionStart ? t('select_end') : t('select_start')}
          </div>
      )}

      {showSaveDialog && (
          <BlueprintSaveDialog 
              onSave={handleSaveBlueprint}
              onCancel={handleCancelBlueprint}
              t={t}
          />
      )}
      
      {editingTilePos && getEditingTile() && (
          <VariantEditor
            tile={getEditingTile()!}
            onSave={handleEditorSave}
            onSaveToInventory={handleEditorSaveToBackpack}
            onClose={() => setEditingTilePos(null)}
            t={t}
          />
      )}

      {editingRailPos && getEditingRailTile() && (
          <RailEditor
            tile={getEditingRailTile()!}
            onSave={handleRailSave}
            onSaveToInventory={handleRailSaveToBackpack}
            onClose={() => setEditingRailPos(null)}
            t={t}
          />
      )}
      
      {showTextureManager && (
          <TextureManager 
              customTextures={gameStateRef.current.customTextures}
              onUpdateTexture={handleUpdateTexture}
              onRestoreDefaults={handleRestoreDefaults}
              onClose={() => setShowTextureManager(false)}
              t={t}
          />
      )}

      <InventoryBar 
         inventory={gameStateRef.current.inventory}
         selectedItem={gameStateRef.current.player.selectedItem}
         onSelect={i => {
             gameStateRef.current.player.selectedItem = i;
             gameStateRef.current.player.placingCustomConfig = null; 
             setActiveBlueprint(null); 
             setIsCreatingBlueprint(false);
             setSelectionStart(null);
             setSelectionEnd(null);
             setShowSaveDialog(false);
             selectionStartRef.current = null;
             setEditingTilePos(null);
             setEditingRailPos(null);
             setUiTrigger(p => p+1);
         }}
         onToggleCrafting={() => {
             setShowCrafting(!showCrafting);
             setShowBlueprints(false);
             setShowBackpack(false);
             setShowTextureManager(false);
         }}
         onToggleBlueprints={() => {
             setShowBlueprints(!showBlueprints);
             setShowCrafting(false);
             setShowBackpack(false);
             setShowTextureManager(false);
         }}
         onToggleBackpack={() => {
             setShowBackpack(!showBackpack);
             setShowCrafting(false);
             setShowBlueprints(false);
             setShowTextureManager(false);
         }}
         strings={{ craft: t('craft_btn'), empty: t('empty'), blueprints: t('blueprints_btn'), backpack: t('backpack_btn') }}
      />
      
      {showCrafting && (
          <CraftingMenu 
             inventory={gameStateRef.current.inventory}
             onCraft={handleCraft}
             onClose={() => setShowCrafting(false)}
             t={t}
          />
      )}
      
      {showBlueprints && (
          <BlueprintMenu 
             inventory={gameStateRef.current.inventory}
             customBlueprints={gameStateRef.current.customBlueprints}
             onSelect={(bp) => {
                 setActiveBlueprint(bp);
                 gameStateRef.current.player.selectedItem = null;
             }}
             onEnterCreationMode={() => {
                 setIsCreatingBlueprint(true);
                 setSelectionStart(null);
                 setSelectionEnd(null);
                 setShowSaveDialog(false);
                 selectionStartRef.current = null;
                 addLog(t('select_start'), "SYSTEM");
             }}
             onClose={() => setShowBlueprints(false)}
             t={t}
          />
      )}

      {showBackpack && (
          <BackpackMenu
              inventory={gameStateRef.current.inventory}
              customItems={gameStateRef.current.customItems}
              onSelect={(item) => {
                  gameStateRef.current.player.selectedItem = item.baseType;
                  gameStateRef.current.player.placingCustomConfig = {
                      ioConfig: item.ioConfig,
                      variant: item.variant,
                      name: item.name
                  };
                  setUiTrigger(p => p+1);
              }}
              onClose={() => setShowBackpack(false)}
              t={t}
          />
      )}

      <OracleLog logs={logs} />
      
      {/* Top Right Controls Group - Polished & High Vis */}
      <div className="fixed top-4 right-4 flex flex-col items-end gap-3 z-[100] pointer-events-none">
         <div className="flex gap-3 pointer-events-auto p-2 bg-slate-900/80 rounded-2xl border border-slate-600 shadow-xl backdrop-blur-md">
            {/* Texture / Palette Button */}
            <button 
                onClick={() => setShowTextureManager(true)}
                className="group relative w-10 h-10 flex items-center justify-center rounded-lg bg-pink-600 border-b-4 border-pink-800 active:border-b-0 active:translate-y-1 transition-all shadow-md hover:bg-pink-500"
                title={t('texture_manager')}
            >
                <Palette size={20} className="text-white drop-shadow-md group-hover:scale-110 transition-transform"/>
            </button>
            
            {/* Save Button */}
            <button 
                onClick={handleSave} 
                className="group relative w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all shadow-md hover:bg-blue-500"
                title={t('save')}
            >
                <Save size={20} className="text-white drop-shadow-md group-hover:scale-110 transition-transform"/>
            </button>
            
            {/* Ask Oracle Button */}
            <button 
                onClick={handleAskOracle}
                disabled={isAiLoading}
                className={`flex items-center gap-2 px-3 h-10 rounded-lg font-bold shadow-md transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
                    isAiLoading 
                    ? 'bg-slate-700 border-slate-800 text-slate-400 cursor-wait' 
                    : 'bg-violet-600 border-violet-800 hover:bg-violet-500 text-white'
                }`}
            >
                <BrainCircuit className={`w-5 h-5 ${isAiLoading ? 'animate-pulse' : 'drop-shadow-md'}`} />
                <span className="text-xs">{t('ask_oracle')}</span>
            </button>
         </div>

         {/* Info Panel - Compact & High Vis */}
         <div className="bg-slate-900/90 backdrop-blur-md p-3 rounded-xl text-slate-300 text-[10px] border border-slate-600 shadow-xl max-w-[180px]">
            <p className="font-bold mb-1.5 flex items-center gap-1.5 text-slate-100 text-xs border-b border-white/10 pb-1">
                <Info size={12}/> {t('controls')}
            </p>
            <div className="space-y-1 opacity-90 leading-tight">
                <p>{t('move')}</p>
                <p>{t('interact')}</p>
                <p>{t('config_gate')}</p>
                <p>{t('automine')}</p>
                <p>{t('mount')}</p>
                <p>{t('craft')}</p>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Game />
    </ErrorBoundary>
  );
}
