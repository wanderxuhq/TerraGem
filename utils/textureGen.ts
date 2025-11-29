
import { TileType } from '../types';
import { TILE_COLORS } from '../constants';

export const generateDefaultTextures = (): Partial<Record<TileType, string>> => {
    const textures: Partial<Record<TileType, string>> = {};
    if (typeof document === 'undefined') return textures;

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return textures;

    const generate = (type: TileType) => {
        // Reset
        ctx.clearRect(0, 0, 64, 64);
        
        // Base Color with fallback
        ctx.fillStyle = TILE_COLORS[type] || '#888888';
        ctx.fillRect(0, 0, 64, 64);

        // Noise / Pattern Generation
        if (type === TileType.GRASS) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            for(let i=0; i<100; i++) ctx.fillRect(Math.random()*64, Math.random()*64, 2, 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            for(let i=0; i<50; i++) ctx.fillRect(Math.random()*64, Math.random()*64, 2, 2);
        } else if (type === TileType.WATER) {
            ctx.fillStyle = '#0ea5e9'; // Explicit brighter blue
            ctx.fillRect(0,0,64,64);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            for(let i=0; i<10; i++) ctx.fillRect(Math.random()*50, Math.random()*60, 10, 2);
        } else if (type === TileType.SAND) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            for(let i=0; i<200; i++) ctx.fillRect(Math.random()*64, Math.random()*64, 1, 1);
        } else if (type === TileType.STONE) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            for(let i=0; i<20; i++) {
                const s = Math.random() * 10 + 2;
                ctx.fillRect(Math.random()*60, Math.random()*60, s, s);
            }
        } else if (type === TileType.WALL) {
            ctx.fillStyle = '#78350f';
            ctx.fillRect(0,0,64,64);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 2;
            for(let y=0; y<64; y+=16) {
                const off = (y/16)%2===0 ? 0 : 16;
                ctx.beginPath();
                ctx.moveTo(0, y); ctx.lineTo(64, y); ctx.stroke();
                for(let x=-16; x<64; x+=32) {
                    ctx.beginPath(); ctx.moveTo(x+off, y); ctx.lineTo(x+off, y+16); ctx.stroke();
                }
            }
        } else if (type === TileType.FLOOR) {
             ctx.fillStyle = '#d6d3d1';
             ctx.fillRect(0,0,64,64);
             ctx.fillStyle = 'rgba(255,255,255,0.2)';
             ctx.fillRect(2,2,28,28);
             ctx.fillRect(34,34,28,28);
        } else if (type === TileType.WOOD) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            for(let i=1; i<8; i++) ctx.fillRect(0, i*8, 64, 1);
        } else if (type === TileType.TREE) {
            // Simple leaves texture
            ctx.fillStyle = '#166534';
            ctx.fillRect(0,0,64,64);
            ctx.fillStyle = '#14532d';
            for(let i=0; i<30; i++) ctx.beginPath(), ctx.arc(Math.random()*64, Math.random()*64, 4, 0, Math.PI*2), ctx.fill();
        } else if (type === TileType.FLOWER) {
             ctx.fillStyle = '#22c55e';
             ctx.fillRect(0,0,64,64);
             // Flowers
             for(let i=0; i<5; i++) {
                 const x = 10 + Math.random()*44;
                 const y = 10 + Math.random()*44;
                 ctx.fillStyle = '#ec4899';
                 ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill();
                 ctx.fillStyle = '#fde047';
                 ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill();
             }
        } else if (type === TileType.SAPLING) {
             ctx.fillStyle = TILE_COLORS.GRASS;
             ctx.fillRect(0,0,64,64);
             ctx.fillStyle = '#166534';
             ctx.fillRect(30, 40, 4, 14);
             ctx.beginPath(); ctx.arc(32, 36, 8, 0, Math.PI*2); ctx.fill();
        }
        
        return canvas.toDataURL();
    };

    const types = [
        TileType.GRASS, TileType.WATER, TileType.SAND, TileType.STONE, 
        TileType.WALL, TileType.FLOOR, TileType.WOOD, TileType.TREE, TileType.FLOWER, TileType.SAPLING
    ];

    types.forEach(t => {
        textures[t] = generate(t);
    });

    return textures;
};
