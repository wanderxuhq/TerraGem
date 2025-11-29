
import { BLUEPRINT_IGNORED_TILES, TILE_COLORS, TILE_SIZE, DIRS } from '../constants';
import { Blueprint, Camera, CHUNK_SIZE, Chunk, GameState, TileType } from '../types';
import { getTile, isRail, isGate } from '../utils/gameUtils';
import { isPowerSourceFor } from './world';

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

              // Check for custom texture
              const customImg = textureCache[tile.type];
              const hasCustomTexture = customImg && customImg.complete && customImg.naturalWidth > 0;

              if (hasCustomTexture) {
                  ctx.drawImage(customImg!, drawX, drawY, TILE_SIZE, TILE_SIZE);
                  // Continue to next tile unless it's a type that needs overlays (like wires/logic)
                  // For simple blocks (Grass, Stone, Wall), the texture replaces everything.
                  // For logic items, we might want to draw the overlay on top.
                  if (tile.type !== TileType.WIRE && 
                      !isGate(tile) && 
                      tile.type !== TileType.LEVER && 
                      tile.type !== TileType.LAMP && 
                      tile.type !== TileType.LAMP_ON &&
                      tile.type !== TileType.RAIL) {
                      continue;
                  }
                  // If it IS a logic item, we let the code below draw the "symbols" on top of the custom background
              }

              // Background (Default if no texture OR texture failed)
              if (!hasCustomTexture) {
                  if (tile.type === TileType.WATER) {
                      ctx.fillStyle = TILE_COLORS.WATER;
                      ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                      ctx.fillStyle = 'rgba(255,255,255,0.1)';
                      if ((x+y)%2===0) ctx.fillRect(drawX+5, drawY+5, TILE_SIZE-10, 2);
                  } else if (tile.type === TileType.FLOOR) {
                      ctx.fillStyle = '#d6d3d1';
                      ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                      ctx.fillStyle = '#a8a29e';
                      ctx.fillRect(drawX + 2, drawY + 2, TILE_SIZE-4, TILE_SIZE-4);
                  } else if (tile.type !== TileType.WIRE && !isGate(tile) && tile.type !== TileType.LEVER && tile.type !== TileType.RAIL) {
                      // Generic background for others if not special logic
                      ctx.fillStyle = TILE_COLORS[tile.type] || '#ff00ff';
                      ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                      if (tile.type === TileType.GRASS) {
                          if (tile.variant === 1) { ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.fillRect(drawX + 4, drawY + 4, 4, 4); }
                          if (tile.variant === 2) { ctx.fillStyle = 'rgba(0,0,0,0.03)'; ctx.fillRect(drawX + 8, drawY + 8, 2, 2); }
                      }
                  }
              }

              // Objects & Overlays
              if (tile.type === TileType.WALL && !hasCustomTexture) {
                  ctx.fillStyle = TILE_COLORS.WALL;
                  ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = 'rgba(0,0,0,0.2)';
                  ctx.fillRect(drawX, drawY + 10, TILE_SIZE, 2);
                  ctx.fillRect(drawX, drawY + 30, TILE_SIZE, 2);
                  ctx.fillRect(drawX + 20, drawY, 2, 10);
              }
              else if (tile.type === TileType.TREE) {
                  // Trees are drawn on top of the base tile (or base texture)
                  // If custom texture exists, we assume it's the "ground" or the "tree" itself?
                  // Usually user wants to re-texture the Tree object. 
                  // If customImg exists, we ALREADY drew it above. 
                  // But TREE usually has transparency or shape. 
                  // If we drew a custom square texture for TREE, it fills the box. 
                  // We skip default drawing if custom exists.
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
              else if (tile.type === TileType.SAPLING && !hasCustomTexture) {
                   ctx.fillStyle = '#166534';
                   ctx.fillRect(drawX + TILE_SIZE/2 - 1, drawY + TILE_SIZE - 10, 2, 10);
                   ctx.beginPath();
                   ctx.arc(drawX + TILE_SIZE/2, drawY + TILE_SIZE - 12, 4, 0, Math.PI*2);
                   ctx.fill();
              }
              else if (tile.type === TileType.STONE && !hasCustomTexture) {
                  ctx.fillStyle = 'rgba(0,0,0,0.2)';
                  ctx.beginPath();
                  ctx.ellipse(drawX + TILE_SIZE/2 + 2, drawY + TILE_SIZE/2 + 2, 10, 8, 0, 0, Math.PI*2);
                  ctx.fill();
                  ctx.fillStyle = '#9ca3af';
                  ctx.beginPath();
                  ctx.arc(drawX + TILE_SIZE/2, drawY + TILE_SIZE/2, TILE_SIZE/2.5, 0, Math.PI*2);
                  ctx.fill();
              }
              else if (tile.type === TileType.FLOWER && !hasCustomTexture) {
                  ctx.fillStyle = TILE_COLORS.FLOWER;
                  ctx.beginPath();
                  ctx.arc(drawX + TILE_SIZE/2, drawY + TILE_SIZE/2, 6, 0, Math.PI*2);
                  ctx.fill();
                  ctx.fillStyle = '#fff';
                  ctx.beginPath();
                  ctx.arc(drawX + TILE_SIZE/2, drawY + TILE_SIZE/2, 2, 0, Math.PI*2);
                  ctx.fill();
              }
              else if (tile.type === TileType.RAIL) {
                   // For Rails, even if we have a custom background texture, we probably want the rails on top?
                   // If custom texture is set for RAIL, assume it replaces the rail art.
                   if (!hasCustomTexture) {
                       const globalX = chunk.x * CHUNK_SIZE + x;
                       const globalY = chunk.y * CHUNK_SIZE + y;
                       
                       const n = isRail(getTile(allChunks, globalX, globalY-1));
                       const s = isRail(getTile(allChunks, globalX, globalY+1));
                       const w = isRail(getTile(allChunks, globalX-1, globalY));
                       const e = isRail(getTile(allChunks, globalX+1, globalY));

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

                       let isCurved = false;
                       let curveType = ''; 
                       
                       if (n && e && !s && !w) { isCurved = true; curveType = 'ne'; }
                       else if (n && w && !s && !e) { isCurved = true; curveType = 'nw'; }
                       else if (s && e && !n && !w) { isCurved = true; curveType = 'se'; }
                       else if (s && w && !n && !e) { isCurved = true; curveType = 'sw'; }

                       if (!isCurved) {
                           const isHorz = (w || e) && !n && !s;
                           if (isHorz) {
                               for(let i=1; i<4; i++) drawSleeper(drawX + i*12, drawY + TILE_SIZE/2, Math.PI/2);
                               ctx.lineWidth = 4; ctx.strokeStyle = '#525252';
                               ctx.beginPath(); ctx.moveTo(drawX, drawY + 16); ctx.lineTo(drawX + TILE_SIZE, drawY + 16); ctx.stroke();
                               ctx.beginPath(); ctx.moveTo(drawX, drawY + 32); ctx.lineTo(drawX + TILE_SIZE, drawY + 32); ctx.stroke();
                           } else {
                               for(let i=1; i<4; i++) drawSleeper(drawX + TILE_SIZE/2, drawY + i*12, 0);
                               ctx.lineWidth = 4; ctx.strokeStyle = '#525252';
                               ctx.beginPath(); ctx.moveTo(drawX + 16, drawY); ctx.lineTo(drawX + 16, drawY + TILE_SIZE); ctx.stroke();
                               ctx.beginPath(); ctx.moveTo(drawX + 32, drawY); ctx.lineTo(drawX + 32, drawY + TILE_SIZE); ctx.stroke();
                           }
                       } 
                       else {
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
                       }
                   }
              }
              else if (tile.type === TileType.WIRE) {
                  // Wires always draw connection logic on top, even if custom bg exists (handled by previous if logic falling through to here)
                  // But wait, if customImg exists, we drew it.
                  // Now we draw the wire overlay.
                  ctx.fillStyle = tile.active ? '#ef4444' : '#7f1d1d';
                  ctx.fillRect(drawX + TILE_SIZE/2 - 3, drawY + TILE_SIZE/2 - 3, 6, 6);
                  const globalX = chunk.x * CHUNK_SIZE + x;
                  const globalY = chunk.y * CHUNK_SIZE + y;
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
              else if (tile.type === TileType.LEVER) {
                  // Lever base is drawn if no custom img. If custom img, we skip base and draw handle?
                  // Logic: If custom img, that's the base. We draw handle on top.
                  if (!hasCustomTexture) {
                      ctx.fillStyle = '#4b5563';
                      ctx.fillRect(drawX + 10, drawY + 10, TILE_SIZE-20, TILE_SIZE-20);
                  }
                  ctx.fillStyle = tile.active ? '#ef4444' : '#854d0e';
                  ctx.fillRect(drawX + 15, drawY + (tile.active ? 15 : 25), TILE_SIZE-30, 10);
              }
              else if (tile.type === TileType.LAMP || tile.type === TileType.LAMP_ON) {
                   if (!hasCustomTexture) {
                       ctx.fillStyle = tile.type === TileType.LAMP_ON ? '#fef08a' : '#4b5563';
                       ctx.fillRect(drawX + 4, drawY + 4, TILE_SIZE-8, TILE_SIZE-8);
                   }
                   if (tile.type === TileType.LAMP_ON) {
                       ctx.shadowColor = '#fef08a';
                       ctx.shadowBlur = 10;
                       ctx.fillStyle = 'rgba(255, 255, 0, 0.3)'; // Overlay for glow if custom texture
                       ctx.fillRect(drawX + 10, drawY + 10, TILE_SIZE-20, TILE_SIZE-20);
                       ctx.shadowBlur = 0;
                   }
              }
              else if (tile.type === TileType.AND_GATE || tile.type === TileType.OR_GATE || tile.type === TileType.NOT_GATE) {
                  // Base
                  if (!hasCustomTexture) {
                      ctx.fillStyle = '#374151'; // Slate 700
                      ctx.fillRect(drawX + 2, drawY + 2, TILE_SIZE-4, TILE_SIZE-4);
                  }
                  
                  // Active indicator for the logic chip itself
                  const isActive = !!tile.active;

                  ctx.save();
                  ctx.translate(drawX + TILE_SIZE/2, drawY + TILE_SIZE/2);
                  const angle = (tile.variant % 4) * (Math.PI / 2);
                  ctx.rotate(angle);
                  
                  // Config
                  const ioConfig = tile.ioConfig !== undefined ? tile.ioConfig : 30; // 3 Inputs (LBR), 1 Output (F)
                  const inputMask = ioConfig & 0x0F;
                  const outputMask = (ioConfig >> 4) & 0x0F;

                  const wireOn = '#ef4444';
                  const wireOff = '#7f1d1d';
                  const globalX = chunk.x * CHUNK_SIZE + x;
                  const globalY = chunk.y * CHUNK_SIZE + y;

                  const drawPort = (side: number) => {
                       // side: 0=Front, 1=Right, 2=Back, 3=Left
                       // Rotate to draw
                       const rot = side * (Math.PI/2);
                       ctx.save();
                       ctx.rotate(rot);
                       
                       const isInput = (inputMask >> side) & 1;
                       const isOutput = (outputMask >> side) & 1;

                       if (isInput) {
                           const absDirIndex = (tile.variant + side) % 4;
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
                  if (tile.type === TileType.AND_GATE) sym = '&';
                  if (tile.type === TileType.OR_GATE) sym = '≥1';
                  if (tile.type === TileType.NOT_GATE) sym = '!';
                  
                  // Correct text rotation so it's readable
                  ctx.rotate(-angle);
                  ctx.fillText(sym, 0, 0);
                  
                  ctx.restore();
              }
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
    activeBlueprint?: Blueprint | null,
    mouseWorldPos?: { x: number, y: number },
    selectionStart?: { x: number, y: number } | null,
    selectionEnd?: { x: number, y: number } | null
) => {
      const width = canvas.width;
      const height = canvas.height;

      const targetX = state.player.x * TILE_SIZE - width/2 + TILE_SIZE/2;
      const targetY = state.player.y * TILE_SIZE - height/2 + TILE_SIZE/2;
      camera.x += (targetX - camera.x) * 0.1;
      camera.y += (targetY - camera.y) * 0.1;
      
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
      
      const startChunkX = Math.floor(camera.x / (CHUNK_SIZE * TILE_SIZE));
      const startChunkY = Math.floor(camera.y / (CHUNK_SIZE * TILE_SIZE));
      const endChunkX = Math.floor((camera.x + width) / (CHUNK_SIZE * TILE_SIZE)) + 1;
      const endChunkY = Math.floor((camera.y + height) / (CHUNK_SIZE * TILE_SIZE)) + 1;

      for(let cy=startChunkY; cy<=endChunkY; cy++) {
          for(let cx=startChunkX; cx<=endChunkX; cx++) {
              const key = `${cx},${cy}`;
              const chunk = state.chunks[key];
              if (chunk) {
                  if (chunk._dirty || !chunk._cache) {
                      renderChunkToCache(chunk, state.chunks, textureCache);
                  }
                  if (chunk._cache) {
                      const drawX = cx * CHUNK_SIZE * TILE_SIZE - camera.x;
                      const drawY = cy * CHUNK_SIZE * TILE_SIZE - camera.y;
                      ctx.drawImage(chunk._cache as HTMLCanvasElement, Math.floor(drawX), Math.floor(drawY));
                  }
              }
          }
      }
      
      state.entities.forEach(ent => {
          const ex = Math.floor(ent.x * TILE_SIZE - camera.x);
          const ey = Math.floor(ent.y * TILE_SIZE - camera.y);

          if (ent.type === 'MINECART') {
              const rotation = ent.rotation || 0;
              ctx.save();
              ctx.translate(ex, ey);
              ctx.rotate(rotation);
              ctx.fillStyle = '#374151'; 
              ctx.fillRect(-16, -12, 32, 24); 
              ctx.fillStyle = '#1f2937'; 
              ctx.fillRect(-12, -8, 24, 16); 
              ctx.fillStyle = '#6b7280';
              ctx.fillRect(12, -10, 4, 20);
              ctx.fillStyle = '#111827';
              ctx.fillRect(-10, -14, 6, 2);
              ctx.fillRect(4, -14, 6, 2);
              ctx.fillRect(-10, 12, 6, 2);
              ctx.fillRect(4, 12, 6, 2);
              ctx.restore();
          } else if (ent.type === 'ROBOT') {
              ctx.fillStyle = TILE_COLORS.ROBOT;
              ctx.beginPath();
              ctx.arc(ex, ey, 12, 0, Math.PI*2);
              ctx.fill();
              ctx.strokeStyle = '#94a3b8';
              ctx.lineWidth = 2;
              ctx.beginPath(); ctx.moveTo(ex, ey - 12); ctx.lineTo(ex, ey - 20); ctx.stroke();
              if (ent.target) { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(ex, ey - 22, 2, 0, Math.PI*2); ctx.fill(); }
          }
      });

      const pX = Math.floor(state.player.x * TILE_SIZE - camera.x);
      const pY = Math.floor(state.player.y * TILE_SIZE - camera.y);
      
      if (!state.player.ridingEntityId) {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.beginPath(); ctx.ellipse(pX + TILE_SIZE/2, pY + TILE_SIZE - 5, 10, 5, 0, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(pX + TILE_SIZE/2, pY + TILE_SIZE/2 - 5, 12, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#000';
          const dir = state.player.direction;
          const eyeOffX = dir === 'left' ? -4 : dir === 'right' ? 4 : 0;
          ctx.beginPath(); ctx.arc(pX + TILE_SIZE/2 - 4 + eyeOffX, pY + TILE_SIZE/2 - 7, 2, 0, Math.PI*2); ctx.arc(pX + TILE_SIZE/2 + 4 + eyeOffX, pY + TILE_SIZE/2 - 7, 2, 0, Math.PI*2); ctx.fill();
      } else {
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(pX, pY, 10, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#000';
          ctx.beginPath(); ctx.arc(pX - 4, pY - 2, 2, 0, Math.PI*2); ctx.arc(pX + 4, pY - 2, 2, 0, Math.PI*2); ctx.fill();
      }

      // Render Blueprint Ghost
      if (activeBlueprint && mouseWorldPos) {
          ctx.save();
          ctx.globalAlpha = 0.5; // Translucent
          
          activeBlueprint.tiles.forEach(t => {
              const worldX = mouseWorldPos.x + t.x;
              const worldY = mouseWorldPos.y + t.y;
              
              const drawX = worldX * TILE_SIZE - camera.x;
              const drawY = worldY * TILE_SIZE - camera.y;

              const customImg = textureCache[t.type];
              if (customImg && customImg.complete && customImg.naturalWidth > 0) {
                  ctx.drawImage(customImg, drawX, drawY, TILE_SIZE, TILE_SIZE);
              } else if (TILE_COLORS[t.type]) {
                  ctx.fillStyle = TILE_COLORS[t.type];
                  ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                  // Border for visibility
                  ctx.strokeStyle = '#fff';
                  ctx.lineWidth = 1;
                  ctx.strokeRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              }
          });
          
          ctx.restore();
      }

      // Render Selection Box
      // Use explicit selectionEnd if provided (when dialog is open), otherwise use current mouse position
      const endPos = selectionEnd || mouseWorldPos;
      
      if (selectionStart && endPos) {
          const x1 = Math.min(selectionStart.x, endPos.x);
          const y1 = Math.min(selectionStart.y, endPos.y);
          const x2 = Math.max(selectionStart.x, endPos.x);
          const y2 = Math.max(selectionStart.y, endPos.y);
          
          const drawX = x1 * TILE_SIZE - camera.x;
          const drawY = y1 * TILE_SIZE - camera.y;
          const drawW = (x2 - x1 + 1) * TILE_SIZE;
          const drawH = (y2 - y1 + 1) * TILE_SIZE;

          ctx.fillStyle = 'rgba(0, 200, 255, 0.2)';
          ctx.fillRect(drawX, drawY, drawW, drawH);
          
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(drawX, drawY, drawW, drawH);
          ctx.setLineDash([]);

          // Highlight selected items within the box
          for (let y = y1; y <= y2; y++) {
             for (let x = x1; x <= x2; x++) {
                 const t = getTile(state.chunks, x, y);
                 // Only highlight items that have been placed
                 if (t && t.placed) {
                      const tDrawX = x * TILE_SIZE - camera.x;
                      const tDrawY = y * TILE_SIZE - camera.y;
                      
                      // Highlight Overlay
                      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                      ctx.fillRect(tDrawX, tDrawY, TILE_SIZE, TILE_SIZE);
                      
                      // Highlight Border
                      ctx.strokeStyle = '#00ffff';
                      ctx.lineWidth = 2;
                      ctx.strokeRect(tDrawX, tDrawY, TILE_SIZE, TILE_SIZE);
                 }
             }
          }
      }
};
