

import { MAX_MINECART_SPEED } from '../constants';
import { Entity, GameState, TileType } from '../types';
import { getTile, isRail } from '../utils/gameUtils';
import { attemptMine } from './world';

export const updateMinecart = (state: GameState, cart: Entity, dt: number, inputDx: number, inputDy: number) => {
    if (cart.vx === undefined) cart.vx = 0;
    if (cart.vy === undefined) cart.vy = 0;
    if (cart.rotation === undefined) cart.rotation = 0;

    const accel = 0.5 * (dt / 16);
    
    // 1. Apply Input Acceleration
    const currentSpeed = Math.sqrt(cart.vx*cart.vx + cart.vy*cart.vy);
    if (inputDx !== 0 || inputDy !== 0) {
        // Enforce Speed Limit on acceleration
        if (currentSpeed < MAX_MINECART_SPEED) {
            cart.vx += inputDx * accel;
            cart.vy += inputDy * accel;
        } else {
             // Allow changing direction if over speed, but don't increase magnitude
            if (Math.sign(cart.vx) !== Math.sign(inputDx)) cart.vx += inputDx * accel;
            if (Math.sign(cart.vy) !== Math.sign(inputDy)) cart.vy += inputDy * accel;
        }
    }

    // Cap velocity absolute hard limit
    const velocity = Math.sqrt(cart.vx*cart.vx + cart.vy*cart.vy);
    if (velocity > MAX_MINECART_SPEED) {
        const scale = MAX_MINECART_SPEED / velocity;
        cart.vx *= scale;
        cart.vy *= scale;
    }

    // 2. Physics & Rail Constraint
    const nextCartX = cart.x + cart.vx * (dt / 100);
    const nextCartY = cart.y + cart.vy * (dt / 100);
    
    const currentTileX = Math.floor(cart.x);
    const currentTileY = Math.floor(cart.y);
    const tile = getTile(state.chunks, currentTileX, currentTileY);

    const isOnRail = tile && tile.type === TileType.RAIL;
    const friction = isOnRail ? 0.995 : 0.85; 
    cart.vx *= friction;
    cart.vy *= friction;
    
    if (Math.abs(cart.vx) > 0.01 || Math.abs(cart.vy) > 0.01) {
        cart.rotation = Math.atan2(cart.vy, cart.vx);
    }
    
    if (Math.abs(cart.vx) < 0.005) cart.vx = 0;
    if (Math.abs(cart.vy) < 0.005) cart.vy = 0;

    if (isOnRail) {
        const n = isRail(getTile(state.chunks, currentTileX, currentTileY-1));
        const s = isRail(getTile(state.chunks, currentTileX, currentTileY+1));
        const w = isRail(getTile(state.chunks, currentTileX-1, currentTileY));
        const e = isRail(getTile(state.chunks, currentTileX+1, currentTileY));

        const centerX = currentTileX + 0.5;
        const centerY = currentTileY + 0.5;
        
        const distToCenter = Math.sqrt((cart.x - centerX)**2 + (cart.y - centerY)**2);
        const passedCenter = (Math.sign(cart.x - centerX) !== Math.sign(nextCartX - centerX)) || 
                             (Math.sign(cart.y - centerY) !== Math.sign(nextCartY - centerY));
        
        let snapped = false;

        const isVertical = (n || s) && !w && !e;
        const isHorizontal = (w || e) && !n && !s;
        
        if (isVertical) {
             cart.x += (centerX - cart.x) * 0.2;
             cart.vx *= 0.05;
             cart.x = centerX; 
             cart.y = nextCartY;
        } else if (isHorizontal) {
             cart.y += (centerY - cart.y) * 0.2;
             cart.vy *= 0.05;
             cart.y = centerY;
             cart.x = nextCartX;
        } else {
            // Corner logic
            if (passedCenter || distToCenter < 0.1) {
                const executeTurn = (newDirX: number, newDirY: number) => {
                    const speed = Math.sqrt(cart.vx!*cart.vx! + cart.vy!*cart.vy!);
                    cart.x = centerX;
                    cart.y = centerY;
                    cart.vx = newDirX * speed;
                    cart.vy = newDirY * speed;
                    cart.rotation = Math.atan2(cart.vy, cart.vx);
                    cart.x += cart.vx * (dt / 100); 
                    cart.y += cart.vy * (dt / 100); 
                    snapped = true;
                };

                const movingN = cart.vy < -0.01;
                const movingS = cart.vy > 0.01;
                const movingW = cart.vx < -0.01;
                const movingE = cart.vx > 0.01;

                if (movingN && !n) {
                    if (w && !e) executeTurn(-1, 0); 
                    else if (e && !w) executeTurn(1, 0);
                    else if (w && e) executeTurn(Math.random() > 0.5 ? 1 : -1, 0);
                }
                else if (movingS && !s) {
                    if (w && !e) executeTurn(-1, 0);
                    else if (e && !w) executeTurn(1, 0);
                    else if (w && e) executeTurn(Math.random() > 0.5 ? 1 : -1, 0);
                }
                else if (movingW && !w) {
                    if (n && !s) executeTurn(0, -1);
                    else if (s && !n) executeTurn(0, 1);
                    else if (n && s) executeTurn(0, Math.random() > 0.5 ? 1 : -1);
                }
                else if (movingE && !e) {
                    if (n && !s) executeTurn(0, -1);
                    else if (s && !n) executeTurn(0, 1);
                    else if (n && s) executeTurn(0, Math.random() > 0.5 ? 1 : -1);
                }
            }
            if (!snapped) {
                cart.x = nextCartX;
                cart.y = nextCartY;
            }
        }
    } else {
        cart.x = nextCartX;
        cart.y = nextCartY;
    }
  };

export const updateRobot = (state: GameState, robot: Entity, dt: number, onMineTrigger?: () => void) => {
      if (!robot.target) {
          let minDist = 10;
          let target: {x: number, y: number} | null = null;
          
          for(let y = Math.floor(robot.y) - 5; y <= Math.floor(robot.y) + 5; y++) {
              for(let x = Math.floor(robot.x) - 5; x <= Math.floor(robot.x) + 5; x++) {
                  const t = getTile(state.chunks, x, y);
                  // Robots only target natural resources, NOT placed blocks
                  if (t && (t.type === TileType.TREE || t.type === TileType.STONE) && !t.placed) {
                      const d = Math.sqrt((x - robot.x)**2 + (y - robot.y)**2);
                      if (d < minDist) {
                          minDist = d;
                          target = {x: x + 0.5, y: y + 0.5};
                      }
                  }
              }
          }
          if (target) robot.target = target;
      }

      if (robot.target) {
          const dx = robot.target.x - (robot.x + 0.5);
          const dy = robot.target.y - (robot.y + 0.5);
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          if (dist < 0.8) {
              attemptMine(state, Math.floor(robot.target.x), Math.floor(robot.target.y), onMineTrigger);
              robot.target = null;
          } else {
              const speed = 2.0 * (dt / 1000);
              robot.x += (dx / dist) * speed;
              robot.y += (dy / dist) * speed;
          }
      }
  };