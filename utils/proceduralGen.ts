
import { TileType } from '../types';
import { TILE_COLORS, TILE_SIZE } from '../constants';

export const generateProceduralTexture = (type: TileType): string => {
  const canvas = document.createElement('canvas');
  // Use TILE_SIZE (48x48) for the files so they map 1:1 with the game grid
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';

  const drawX = 0;
  const drawY = 0;

  // Backgrounds
  if (type === TileType.WATER) {
      ctx.fillStyle = TILE_COLORS.WATER;
      ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(drawX+5, drawY+5, TILE_SIZE-10, 2);
  } else if (type === TileType.FLOOR) {
      ctx.fillStyle = '#d6d3d1';
      ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(drawX + 2, drawY + 2, TILE_SIZE-4, TILE_SIZE-4);
  } else if (type === TileType.GRASS || type === TileType.SAPLING) {
      ctx.fillStyle = TILE_COLORS.GRASS;
      ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
      // Grass detail (static for icon)
      ctx.fillStyle = 'rgba(0,0,0,0.05)'; 
      ctx.fillRect(drawX + 4, drawY + 4, 4, 4);
      ctx.fillStyle = 'rgba(0,0,0,0.03)'; 
      ctx.fillRect(drawX + 8, drawY + 8, 2, 2);
  } else {
      // Default fill (handles WOOD, etc)
      ctx.fillStyle = TILE_COLORS[type] || '#ff00ff';
      ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
  }

  // Overlays / Details
  if (type === TileType.WALL) {
      ctx.fillStyle = TILE_COLORS.WALL;
      ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(drawX, drawY + 10, TILE_SIZE, 2);
      ctx.fillRect(drawX, drawY + 30, TILE_SIZE, 2);
      ctx.fillRect(drawX + 20, drawY, 2, 10);
  } else if (type === TileType.WOOD) {
      // Wood plank detail
      ctx.fillStyle = TILE_COLORS.WOOD; 
      ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(drawX + 4, drawY, 2, TILE_SIZE);
      ctx.fillRect(drawX + 20, drawY, 2, TILE_SIZE);
      ctx.fillRect(drawX + 36, drawY, 2, TILE_SIZE);
  } else if (type === TileType.SAPLING) {
      ctx.fillStyle = '#166534';
      ctx.fillRect(drawX + TILE_SIZE/2 - 1, drawY + TILE_SIZE - 10, 2, 10);
      ctx.beginPath();
      ctx.arc(drawX + TILE_SIZE/2, drawY + TILE_SIZE - 12, 4, 0, Math.PI*2);
      ctx.fill();
  } else if (type === TileType.TREE) {
      ctx.fillStyle = TILE_COLORS.GRASS; // Base
      ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
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
  } else if (type === TileType.STONE) {
      ctx.fillStyle = TILE_COLORS.GRASS; // Base
      ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(drawX + TILE_SIZE/2 + 2, drawY + TILE_SIZE/2 + 2, 10, 8, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath();
      ctx.arc(drawX + TILE_SIZE/2, drawY + TILE_SIZE/2, TILE_SIZE/2.5, 0, Math.PI*2);
      ctx.fill();
  } else if (type === TileType.FLOWER) {
      ctx.fillStyle = TILE_COLORS.GRASS; // Base
      ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = TILE_COLORS.FLOWER;
      ctx.beginPath();
      ctx.arc(drawX + TILE_SIZE/2, drawY + TILE_SIZE/2, 6, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(drawX + TILE_SIZE/2, drawY + TILE_SIZE/2, 2, 0, Math.PI*2);
      ctx.fill();
  } else if (type === TileType.LEVER) {
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(drawX + 10, drawY + 10, TILE_SIZE-20, TILE_SIZE-20);
      ctx.fillStyle = '#854d0e'; // Off state
      ctx.fillRect(drawX + 15, drawY + 25, TILE_SIZE-30, 10);
  } else if (type === TileType.LAMP) {
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(drawX + 4, drawY + 4, TILE_SIZE-8, TILE_SIZE-8);
  } else if (type === TileType.LAMP_ON) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(drawX + 4, drawY + 4, TILE_SIZE-8, TILE_SIZE-8);
      ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.fillRect(drawX + 10, drawY + 10, TILE_SIZE-20, TILE_SIZE-20);
  } else if (type === TileType.RAIL) {
      // Just a simple horizontal rail segment for the icon
      ctx.fillStyle = TILE_COLORS.FLOOR; // Base
      ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
      
      const drawSleeper = (cx: number) => {
          ctx.fillStyle = '#573010';
          ctx.fillRect(cx - 3, 4, 6, TILE_SIZE-8);
          ctx.fillStyle = '#3f2106'; 
          ctx.fillRect(cx - 1, 6, 2, TILE_SIZE-12);
      };
      
      for(let i=1; i<4; i++) drawSleeper(drawX + i*12);
      
      ctx.lineWidth = 4; ctx.strokeStyle = '#525252';
      ctx.beginPath(); ctx.moveTo(drawX, drawY + 16); ctx.lineTo(drawX + TILE_SIZE, drawY + 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(drawX, drawY + 32); ctx.lineTo(drawX + TILE_SIZE, drawY + 32); ctx.stroke();
  } else if (type === TileType.WIRE) {
       ctx.fillStyle = TILE_COLORS.FLOOR; // Base
       ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
       ctx.fillStyle = '#7f1d1d'; // Wire Off
       ctx.fillRect(drawX + TILE_SIZE/2 - 3, drawY, 6, TILE_SIZE); // Vertical wire
       ctx.fillRect(drawX, drawY + TILE_SIZE/2 - 3, TILE_SIZE, 6); // Horizontal wire
  } else if (type === TileType.AND_GATE || type === TileType.OR_GATE || type === TileType.NOT_GATE) {
       ctx.fillStyle = '#374151'; 
       ctx.fillRect(drawX + 2, drawY + 2, TILE_SIZE-4, TILE_SIZE-4);
  } else if (type === TileType.ROBOT) {
      ctx.fillStyle = '#374151'; // Dark bg
      ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = TILE_COLORS.ROBOT;
      ctx.beginPath();
      ctx.arc(drawX + TILE_SIZE/2, drawY + TILE_SIZE/2, 12, 0, Math.PI*2);
      ctx.fill();
  } else if (type === TileType.MINECART) {
      ctx.fillStyle = '#525252'; // Rail bg
      ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#374151'; 
      ctx.fillRect(drawX + 8, drawY + 12, 32, 24); 
  } else if (type === TileType.AXE) {
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.clearRect(0,0,TILE_SIZE,TILE_SIZE);
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🪓', TILE_SIZE/2, TILE_SIZE/2);
      return canvas.toDataURL('image/png'); // Return emoji render
  } else if (type === TileType.PICKAXE) {
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.clearRect(0,0,TILE_SIZE,TILE_SIZE);
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⛏️', TILE_SIZE/2, TILE_SIZE/2);
      return canvas.toDataURL('image/png');
  }

  return canvas.toDataURL('image/png');
};
