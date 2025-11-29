


import { BLUEPRINT_IGNORED_TILES, TILE_COLORS, TILE_SIZE, DIRS } from '../constants';
import { Blueprint, Camera, CHUNK_SIZE, Chunk, GameState, TileType, Tile } from '../types';
import { getTile, isRail, isGate, isPowerSourceFor } from '../utils/gameUtils';

const drawTileVisuals = (
    ctx: CanvasRenderingContext2D,
    type: TileType,
    variant: number,
    drawX: number,
    drawY: number,
    tileData: Tile | null, // Can be null if drawing simple background
    textureCache: Partial<Record<TileType, HTMLImageElement>>,
    allChunks: Record<string, Chunk>,
    globalX: number,
    globalY: number
) => {
    // Special handling for FLOWER to ensure it has a ground when used as background or foreground
    if (type === TileType.FLOWER) {
         // Draw generic grass base first, so flowers (which are overlays) don't float on void if used as background
         ctx.fillStyle = TILE_COLORS.GRASS;
         ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
         ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.fillRect(drawX + 4, drawY + 4, 4, 4);
         ctx.fillStyle = 'rgba(0,0,0,0.03)'; ctx.fillRect(drawX + 8, drawY + 8, 2, 2);
    }

    // Check for custom texture
    const customImg = textureCache[type];
    const hasCustomTexture = customImg && customImg.complete && customImg.naturalWidth > 0;

    if (hasCustomTexture) {
        ctx.drawImage(customImg!, drawX, drawY, TILE_SIZE, TILE_SIZE);
        // Continue to next logic unless it's a type that needs overlays (like wires/logic)
        if (type !== TileType.WIRE && 
            !isGate({type} as Tile) && 
            type !== TileType.LEVER && 
            type !== TileType.LAMP && 
            type !== TileType.LAMP_ON &&
            type !== TileType.RAIL) {
            return;
        }
    }

    // Background (Default if no texture OR texture failed)
    if (!hasCustomTexture) {
        if (type === TileType.WATER) {
            ctx.fillStyle = TILE_COLORS.WATER;
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            if ((globalX+globalY)%2===0) ctx.fillRect(drawX+5, drawY+5, TILE_SIZE-10, 2);
        } else if (type === TileType.FLOOR) {
            ctx.fillStyle = '#d6d3d1';
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#a8a29e';
            ctx.fillRect(drawX + 2, drawY + 2, TILE_SIZE-4, TILE_SIZE-4);
        } else if (type !== TileType.WIRE && !isGate({type} as Tile) && type !== TileType.LEVER && type !== TileType.RAIL && type !== TileType.FLOWER) {
            // Generic background for others if not special logic
            ctx.fillStyle = TILE_COLORS[type] || '#ff00ff';
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            if (type === TileType.GRASS) {
                if (variant === 1) { ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.fillRect(drawX + 4, drawY + 4, 4, 4); }
                if (variant === 2) { ctx.fillStyle = 'rgba(0,0,0,0.03)'; ctx.fillRect(drawX + 8, drawY + 8, 2, 2); }
            }
        }
    }

    // Objects & Overlays
    if (type === TileType.WALL && !hasCustomTexture) {
        ctx.fillStyle = TILE_COLORS.WALL;
        ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(drawX, drawY + 10, TILE_SIZE, 2);
        ctx.fillRect(drawX, drawY + 30, TILE_SIZE, 2);
        ctx.fillRect(drawX + 20, drawY, 2, 10);
    }
    else if (type === TileType.TREE) {
        if (!hasCustomTexture) {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(drawX + TILE_SIZE/2, drawY + TILE_SIZE - 5, 12, 6, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#451a03';
            ctx.fillRect(drawX + TILE_SIZE/2 - 4, drawY + TILE_SIZE/2, 8, TILE_SIZE/2);
            ctx.fillStyle = '#166534';
            ctx.beginPath();
            ctx.arc(drawX + TILE_SIZE/2, drawY + TILE_SIZE/2 - 5, TILE_SIZE/2.5, 0, Math.PI*2);
            ctx.fill();
        }
    }
    else if (type === TileType.SAPLING && !hasCustomTexture) {
            ctx.fillStyle = '#166534';
            ctx.fillRect(drawX + TILE_SIZE/2 - 1, drawY + TILE_SIZE - 10, 2, 10);
            ctx.beginPath();
            ctx.arc(drawX + TILE_SIZE/2, drawY + TILE_SIZE - 12, 4, 0, Math.PI*2);
            ctx.fill();
    }
    else if (type === TileType.STONE && !hasCustomTexture) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(drawX + TILE_SIZE/2 + 2, drawY + TILE_SIZE/2 + 2, 10, 8, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#9ca3af';
        ctx.beginPath();
        ctx.arc(drawX + TILE_SIZE/2, drawY + TILE_SIZE/2, TILE_SIZE/2.5, 0, Math.PI*2);
        ctx.fill();
    }
    else if (type === TileType.FLOWER && !hasCustomTexture) {
        ctx.fillStyle = TILE_COLORS.FLOWER;
        ctx.beginPath();
        ctx.arc(drawX + TILE_SIZE/2, drawY + TILE_SIZE/2, 6, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(drawX + TILE_SIZE/2, drawY + TILE_SIZE/2, 2, 0, Math.PI*2);
        ctx.fill();
    }
    else if (type === TileType.RAIL) {
            if (!hasCustomTexture) {
                // Background was already drawn by the layering system if present.

                const v = tileData?.variant || 0; 
                // 0: Auto
                // >0: Bitmask (N=1, E=2, S=4, W=8)

                let n = isRail(getTile(allChunks, globalX, globalY-1));
                let s = isRail(getTile(allChunks, globalX, globalY+1));
                let w = isRail(getTile(allChunks, globalX-1, globalY));
                let e = isRail(getTile(allChunks, globalX+1, globalY));

                // Mask neighbors based on forced variants
                if (v > 0) {
                    n = n && !!(v & 1);
                    e = e && !!(v & 2);
                    s = s && !!(v & 4);
                    w = w && !!(v & 8);
                    // Force display if explicitly set in bitmask
                    if (v & 1) n = true;
                    if (v & 2) e = true;
                    if (v & 4) s = true;
                    if (v & 8) w = true;
                }

                // Rail Styling
                ctx.strokeStyle = '#525252'; 
                ctx.lineWidth = 4;
                
                const drawSleeper = (cx: number, cy: number, angle: number) => {
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(angle);
                    ctx.fillStyle = '#573010';
                    ctx.fillRect(-12, -3, 24, 6);
                    ctx.fillStyle = '#3f2106'; // Detail
                    ctx.fillRect(-10, -1, 20, 2);
                    ctx.restore();
                };

                const connectionCount = (n?1:0) + (s?1:0) + (w?1:0) + (e?1:0);
                const isStraightVert = n && s && !w && !e;
                const isStraightHorz = w && e && !n && !s;
                
                // If isolated (single rail), default to vertical rendering so it's visible
                const isIsolated = connectionCount === 0;
                
                let simpleCurve = false;
                let curveType = '';
                if (connectionCount === 2) {
                    if (n && e) { simpleCurve = true; curveType = 'ne'; }
                    if (n && w) { simpleCurve = true; curveType = 'nw'; }
                    if (s && e) { simpleCurve = true; curveType = 'se'; }
                    if (s && w) { simpleCurve = true; curveType = 'sw'; }
                }

                if (isStraightVert || isIsolated) {
                    for(let i=1; i<4; i++) drawSleeper(drawX + TILE_SIZE/2, drawY + i*12, 0);
                    ctx.beginPath(); ctx.moveTo(drawX + 16, drawY); ctx.lineTo(drawX + 16, drawY + TILE_SIZE); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(drawX + 32, drawY); ctx.lineTo(drawX + 32, drawY + TILE_SIZE); ctx.stroke();
                } else if (isStraightHorz) {
                    for(let i=1; i<4; i++) drawSleeper(drawX + i*12, drawY + TILE_SIZE/2, Math.PI/2);
                    ctx.beginPath(); ctx.moveTo(drawX, drawY + 16); ctx.lineTo(drawX + TILE_SIZE, drawY + 16); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(drawX, drawY + 32); ctx.lineTo(drawX + TILE_SIZE, drawY + 32); ctx.stroke();
                } else if (simpleCurve) {
                    // Curve Rendering
                    let cx = 0, cy = 0, startAngle = 0, endAngle = 0;
                    if (curveType === 'se') { cx = drawX + TILE_SIZE; cy = drawY + TILE_SIZE; startAngle = Math.PI; endAngle = 1.5 * Math.PI; }
                    else if (curveType === 'sw') { cx = drawX; cy = drawY + TILE_SIZE; startAngle = 1.5 * Math.PI; endAngle = 2 * Math.PI; }
                    else if (curveType === 'ne') { cx = drawX + TILE_SIZE; cy = drawY; startAngle = 0.5 * Math.PI; endAngle = Math.PI; }
                    else if (curveType === 'nw') { cx = drawX; cy = drawY; startAngle = 0; endAngle = 0.5 * Math.PI; }
                    
                    for(let i=1; i<=3; i++) {
                        const a = startAngle + (endAngle - startAngle) * (i/4);
                        const sx = cx + Math.cos(a) * (TILE_SIZE/2);
                        const sy = cy + Math.sin(a) * (TILE_SIZE/2);
                        drawSleeper(sx, sy, a);
                    }
                    ctx.lineWidth = 4; ctx.strokeStyle = '#525252';
                    ctx.beginPath(); ctx.arc(cx, cy, TILE_SIZE/2 - 8, startAngle, endAngle); ctx.stroke();
                    ctx.beginPath(); ctx.arc(cx, cy, TILE_SIZE/2 + 8, startAngle, endAngle); ctx.stroke();
                } else {
                    // Complex Junction (Cross, T, Dead End) -> Draw Arms
                    const cx = drawX + TILE_SIZE/2;
                    const cy = drawY + TILE_SIZE/2;
                    
                    // Vertical segments
                    if (n) {
                        drawSleeper(cx, cy - 12, 0);
                        ctx.beginPath(); ctx.moveTo(drawX + 16, cy); ctx.lineTo(drawX + 16, drawY); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(drawX + 32, cy); ctx.lineTo(drawX + 32, drawY); ctx.stroke();
                    }
                    if (s) {
                        drawSleeper(cx, cy + 12, 0);
                        ctx.beginPath(); ctx.moveTo(drawX + 16, cy); ctx.lineTo(drawX + 16, drawY + TILE_SIZE); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(drawX + 32, cy); ctx.lineTo(drawX + 32, drawY + TILE_SIZE); ctx.stroke();
                    }
                    
                    // Horizontal segments
                    if (w) {
                        drawSleeper(cx - 12, cy, Math.PI/2);
                        ctx.beginPath(); ctx.moveTo(cx, drawY + 16); ctx.lineTo(drawX, drawY + 16); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(cx, drawY + 32); ctx.lineTo(drawX, drawY + 32); ctx.stroke();
                    }
                    if (e) {
                        drawSleeper(cx + 12, cy, Math.PI/2);
                        ctx.beginPath(); ctx.moveTo(cx, drawY + 16); ctx.lineTo(drawX + TILE_SIZE, drawY + 16); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(cx, drawY + 32); ctx.lineTo(drawX + TILE_SIZE, drawY + 32); ctx.stroke();
                    }
                    
                    // Draw Center intersection box to clean up joints
                    ctx.fillStyle = '#525252';
                    if ((n || s) && (w || e)) {
                        ctx.fillRect(cx - 8, cy - 8, 4, 16); // V Left
                        ctx.fillRect(cx + 4, cy - 8, 4, 16); // V Right
                        ctx.fillRect(cx - 8, cy - 8, 16, 4); // H Top
                        ctx.fillRect(cx - 8, cy + 4, 16, 4); // H Bottom
                    }
                }
            }
    }
    else if (type === TileType.WIRE) {
        ctx.fillStyle = tileData?.active ? '#ef4444' : '#7f1d1d';
        ctx.fillRect(drawX + TILE_SIZE/2 - 3, drawY + TILE_SIZE/2 - 3, 6, 6);
        const neighbors = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];
        neighbors.forEach(n => {
                const nt = getTile(allChunks, globalX+n.dx, globalY+n.dy);
                if (nt && (nt.type === TileType.WIRE || nt.type === TileType.LEVER || nt.type === TileType.LAMP || nt.type === TileType.LAMP_ON || 
                            nt.type === TileType.AND_GATE || nt.type === TileType.OR_GATE || nt.type === TileType.NOT_GATE)) {
                    const w = n.dx!==0 ? 24 : 4;
                    const h = n.dy!==0 ? 24 : 4;
                    ctx.fillRect(drawX + TILE_SIZE/2 - w/2 + n.dx*12, drawY + TILE_SIZE/2 - h/2 + n.dy*12, w, h);
                }
        });
    }
    else if (type === TileType.LEVER) {
        if (!hasCustomTexture) {
            ctx.fillStyle = '#4b5563';
            ctx.fillRect(drawX + 10, drawY + 10, TILE_SIZE-20, TILE_SIZE-20);
        }
        ctx.fillStyle = tileData?.active ? '#ef4444' : '#854d0e';
        ctx.fillRect(drawX + 15, drawY + (tileData?.active ? 15 : 25), TILE_SIZE-30, 10);
    }
    else if (type === TileType.LAMP || type === TileType.LAMP_ON) {
            if (!hasCustomTexture) {
                ctx.fillStyle = type === TileType.LAMP_ON ? '#fef08a' : '#4b5563';
                ctx.fillRect(drawX + 4, drawY + 4, TILE_SIZE-8, TILE_SIZE-8);
            }
            if (type === TileType.LAMP_ON) {
                ctx.shadowColor = '#fef08a';
                ctx.shadowBlur = 10;
                ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                ctx.fillRect(drawX + 10, drawY + 10, TILE_SIZE-20, TILE_SIZE-20);
                ctx.shadowBlur = 0;
            }
    }
    else if (type === TileType.AND_GATE || type === TileType.OR_GATE || type === TileType.NOT_GATE) {
        // Base
        if (!hasCustomTexture) {
            ctx.fillStyle = '#374151'; // Slate 700
            ctx.fillRect(drawX + 2, drawY + 2, TILE_SIZE-4, TILE_SIZE-4);
        }
        
        if (tileData) {
            // Active indicator for the logic chip itself
            const isActive = !!tileData.active;

            ctx.save();
            ctx.translate(drawX + TILE_SIZE/2, drawY + TILE_SIZE/2);
            const angle = (tileData.variant % 4) * (Math.PI / 2);
            ctx.rotate(angle);
            
            // Config
            const ioConfig = tileData.ioConfig !== undefined ? tileData.ioConfig : 30; // 3 Inputs (LBR), 1 Output (F)
            const inputMask = ioConfig & 0x0F;
            const outputMask = (ioConfig >> 4) & 0x0F;

            const wireOn = '#ef4444';
            const wireOff = '#7f1d1d';

            const drawPort = (side: number) => {
                    // side: 0=Front, 1=Right, 2=Back, 3=Left
                    // Rotate to draw
                    const rot = side * (Math.PI/2);
                    ctx.save();
                    ctx.rotate(rot);
                    
                    const isInput = (inputMask >> side) & 1;
                    const isOutput = (outputMask >> side) & 1;

                    if (isInput) {
                        const absDirIndex = (tileData.variant + side) % 4;
                        const dir = DIRS[absDirIndex];
                        const neighbor = getTile(allChunks, globalX + dir.dx, globalY + dir.dy);
                        let inputSignal = false;
                        if (neighbor) {
                            if (neighbor.type === TileType.WIRE || neighbor.type === TileType.LEVER || neighbor.type === TileType.LAMP || neighbor.type === TileType.LAMP_ON) {
                                inputSignal = !!neighbor.active;
                            } else if (isGate(neighbor)) {
                                inputSignal = isPowerSourceFor(neighbor, globalX, globalY);
                            }
                        }
                        
                        ctx.fillStyle = inputSignal ? wireOn : wireOff; 
                        // Draw input node (dot)
                        ctx.beginPath();
                        ctx.arc(0, -20, 3, 0, Math.PI*2);
                        ctx.fill();
                    }
                    if (isOutput) {
                        // Output is active if the gate is active
                        ctx.fillStyle = isActive ? wireOn : wireOff;
                        // Draw output arrow
                        ctx.beginPath();
                        ctx.moveTo(0, -22);
                        ctx.lineTo(-4, -16);
                        ctx.lineTo(4, -16);
                        ctx.fill();
                    }

                    ctx.restore();
            };

            for(let i=0; i<4; i++) drawPort(i);
            
            // Symbol
            ctx.fillStyle = isActive ? wireOn : '#9ca3af';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            let sym = '';
            if (type === TileType.AND_GATE) sym = '&';
            if (type === TileType.OR_GATE) sym = '≥1';
            if (type === TileType.NOT_GATE) sym = '!';
            
            // Correct text rotation so it's readable
            ctx.rotate(-angle);
            ctx.fillText(sym, 0, 0);
            
            ctx.restore();
        }
    }
};

export const renderChunkToCache = (chunk: Chunk, allChunks: Record<string, Chunk>, textureCache: Partial<Record<TileType, HTMLImageElement>>) => {
      const cvs = document.createElement('canvas');
      cvs.width = CHUNK_SIZE * TILE_SIZE;
      cvs.height = CHUNK_SIZE * TILE_SIZE;
      const ctx = cvs.getContext('2d');
      if (!ctx) return;

      for (let y = 0; y < CHUNK_SIZE; y++) {
          for (let x = 0; x < CHUNK_SIZE; x++) {
              const tile = chunk.tiles[y][x];
              const drawX = x * TILE_SIZE;
              const drawY = y * TILE_SIZE;
              const globalX = chunk.x * CHUNK_SIZE + x;
              const globalY = chunk.y * CHUNK_SIZE + y;

              // 1. Draw Background Layer (if present)
              if (tile.backgroundType) {
                   drawTileVisuals(ctx, tile.backgroundType, tile.variant, drawX, drawY, null, textureCache, allChunks, globalX, globalY);
              }

              // 2. Draw Main Layer
              drawTileVisuals(ctx, tile.type, tile.variant, drawX, drawY, tile, textureCache, allChunks, globalX, globalY);
          }
      }
      chunk._cache = cvs;
      chunk._dirty = false;
};

export const renderScene = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    state: GameState,
    camera: Camera,
    textureCache: Partial<Record<TileType, HTMLImageElement>>,
    activeBlueprint: Blueprint | null,
    mouseWorld: { x: number, y: number },
    selectionStart: { x: number, y: number } | null,
    selectionEnd: { x: number, y: number } | null
) => {
    // 1. Update Camera to follow player (centering)
    const viewportW = canvas.width;
    const viewportH = canvas.height;
    
    // Target camera position (center of player)
    const targetCamX = -state.player.x * TILE_SIZE + viewportW / 2;
    const targetCamY = -state.player.y * TILE_SIZE + viewportH / 2;
    
    // Smooth Lerp
    // camera.x += (targetCamX - camera.x) * 0.1;
    // camera.y += (targetCamY - camera.y) * 0.1;
    // For now, instant snap to avoid jitter if loop is not strictly synced or logic update is separate
    camera.x = targetCamX;
    camera.y = targetCamY;

    // 2. Clear
    ctx.fillStyle = '#0f172a'; // Slate 900
    ctx.fillRect(0, 0, viewportW, viewportH);

    // 3. Render Visible Chunks
    const startCol = Math.floor(-camera.x / TILE_SIZE);
    const endCol = startCol + (viewportW / TILE_SIZE) + 1;
    const startRow = Math.floor(-camera.y / TILE_SIZE);
    const endRow = startRow + (viewportH / TILE_SIZE) + 1;

    const startChunkX = Math.floor(startCol / CHUNK_SIZE);
    const endChunkX = Math.floor(endCol / CHUNK_SIZE);
    const startChunkY = Math.floor(startRow / CHUNK_SIZE);
    const endChunkY = Math.floor(endRow / CHUNK_SIZE);

    for (let cy = startChunkY; cy <= endChunkY; cy++) {
        for (let cx = startChunkX; cx <= endChunkX; cx++) {
            const key = `${cx},${cy}`;
            let chunk = state.chunks[key];
            
            // Generate dummy chunk if missing for visual continuity (optional, or just skip)
            // But game logic should generate chunks around player.
            
            if (chunk) {
                if (chunk._dirty || !chunk._cache) {
                    renderChunkToCache(chunk, state.chunks, textureCache);
                }
                
                // Determine screen position
                const drawX = Math.floor(cx * CHUNK_SIZE * TILE_SIZE + camera.x);
                const drawY = Math.floor(cy * CHUNK_SIZE * TILE_SIZE + camera.y);
                
                if (chunk._cache) {
                   ctx.drawImage(chunk._cache as HTMLCanvasElement, drawX, drawY);
                }
            }
        }
    }

    // 4. Render Entities
    // Sort entities by Y for simple depth sorting
    const renderList = [...state.entities];
    renderList.sort((a, b) => a.y - b.y);

    for (const entity of renderList) {
        // Skip if out of bounds (optimization)
        const ex = entity.x * TILE_SIZE + camera.x;
        const ey = entity.y * TILE_SIZE + camera.y;
        if (ex < -TILE_SIZE || ex > viewportW || ey < -TILE_SIZE || ey > viewportH) continue;

        ctx.save();
        ctx.translate(ex, ey);
        if (entity.rotation) ctx.rotate(entity.rotation);

        if (entity.type === 'MINECART') {
             const tex = textureCache[TileType.MINECART];
             if (tex && tex.complete && tex.naturalWidth > 0) {
                 ctx.drawImage(tex, -TILE_SIZE/2, -TILE_SIZE/2, TILE_SIZE, TILE_SIZE);
             } else {
                ctx.fillStyle = '#475569';
                ctx.beginPath();
                ctx.roundRect(-16, -10, 32, 20, 4);
                ctx.fill();
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(-12, -8, 24, 16);
             }
        } else if (entity.type === 'ROBOT') {
             const tex = textureCache[TileType.ROBOT];
             if (tex && tex.complete && tex.naturalWidth > 0) {
                 ctx.drawImage(tex, -TILE_SIZE/2, -TILE_SIZE/2, TILE_SIZE, TILE_SIZE);
             } else {
                ctx.fillStyle = '#0ea5e9';
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(4, -4, 4, 0, Math.PI*2);
                ctx.fill();
             }
        }
        ctx.restore();
    }

    // 5. Render Player (if visible and not riding)
    if (!state.player.ridingEntityId) {
        const px = state.player.x * TILE_SIZE + camera.x;
        const py = state.player.y * TILE_SIZE + camera.y;

        ctx.save();
        ctx.translate(px, py);
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 12, 6, 0, 0, Math.PI*2);
        ctx.fill();

        // Player Body
        ctx.fillStyle = '#fbbf24'; // Amber-400
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI*2);
        ctx.fill();
        
        // Eyes/Direction
        ctx.fillStyle = '#000';
        let eyeOffX = 0, eyeOffY = 0;
        if (state.player.direction === 'left') eyeOffX = -4;
        if (state.player.direction === 'right') eyeOffX = 4;
        if (state.player.direction === 'up') eyeOffY = -4;
        if (state.player.direction === 'down') eyeOffY = 4;
        
        ctx.beginPath(); ctx.arc(-4 + eyeOffX, -2 + eyeOffY, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(4 + eyeOffX, -2 + eyeOffY, 2, 0, Math.PI*2); ctx.fill();

        ctx.restore();
    }

    // 6. Highlight Selection / Mouse
    const mx = Math.floor(mouseWorld.x) * TILE_SIZE + camera.x;
    const my = Math.floor(mouseWorld.y) * TILE_SIZE + camera.y;

    if (activeBlueprint) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        for (const t of activeBlueprint.tiles) {
             const bx = mx + t.x * TILE_SIZE;
             const by = my + t.y * TILE_SIZE;
             if (!BLUEPRINT_IGNORED_TILES.has(t.type)) {
                 ctx.fillStyle = TILE_COLORS[t.type] || '#fff';
                 ctx.fillRect(bx, by, TILE_SIZE, TILE_SIZE);
             }
        }
        ctx.restore();
        
        // Outline
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.strokeRect(mx - TILE_SIZE * 2, my - TILE_SIZE * 2, TILE_SIZE*5, TILE_SIZE*5); // Approximate visual
    } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(mx, my, TILE_SIZE, TILE_SIZE);
    }

    // 7. Render Selection Rectangle (Blueprint Creation)
    if (selectionStart) {
        const sx = selectionStart.x * TILE_SIZE + camera.x;
        const sy = selectionStart.y * TILE_SIZE + camera.y;
        
        let ex = mx;
        let ey = my;

        // If selectionEnd is set (though likely we are in a dialog if set), use it
        if (selectionEnd) {
             ex = selectionEnd.x * TILE_SIZE + camera.x;
             ey = selectionEnd.y * TILE_SIZE + camera.y;
        }
        
        const rectX = Math.min(sx, ex);
        const rectY = Math.min(sy, ey);
        const rectW = Math.abs(ex - sx) + TILE_SIZE;
        const rectH = Math.abs(ey - sy) + TILE_SIZE;

        ctx.fillStyle = 'rgba(6, 182, 212, 0.3)'; // Cyan
        ctx.fillRect(rectX, rectY, rectW, rectH);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(rectX, rectY, rectW, rectH);
        ctx.setLineDash([]);
    }
};
