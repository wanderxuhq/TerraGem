
import { Blueprint, Recipe, TileType } from './types';

export const TILE_SIZE = 48; // Increased for better detail
export const MAX_MINECART_SPEED = 0.25;

// Translation System
export const STRINGS: Record<string, { en: string; zh: string }> = {
  'welcome': { en: 'Welcome to TerraGen', zh: '欢迎来到 TerraGen' },
  'controls': { en: 'Controls', zh: '操作指南' },
  'move': { en: 'WASD / Arrows to Move', zh: 'WASD / 方向键 移动' },
  'interact': { en: 'Click to Mine/Place', zh: '左键点击 挖掘/放置' },
  'config_gate': { en: 'Shift+Click to Config Gate', zh: 'Shift+点击 配置逻辑门' },
  'automine': { en: 'Hold CTRL + Move to Auto-Mine', zh: '按住 CTRL 移动自动挖掘' },
  'craft': { en: 'E to Craft', zh: 'E 打开合成' },
  'save_loaded': { en: 'Game Loaded', zh: '存档已读取' },
  'ask_oracle': { en: 'Ask Oracle', zh: '询问先知' },
  'thinking': { en: 'Thinking...', zh: '思考中...' },
  'craft_btn': { en: 'Craft', zh: '合成' },
  'blueprints_btn': { en: 'Blueprints', zh: '蓝图' },
  'backpack_btn': { en: 'Backpack', zh: '背包' },
  'create_blueprint': { en: 'Create New', zh: '新建蓝图' },
  'select_start': { en: 'Select Start Point', zh: '选择起点' },
  'select_end': { en: 'Select End Point', zh: '选择终点' },
  'blueprint_name': { en: 'Blueprint Name:', zh: '蓝图名称:' },
  'blueprint_saved': { en: 'Blueprint Saved!', zh: '蓝图已保存!' },
  'blueprint_empty': { en: 'Blueprint is empty (Select structures, not terrain)!', zh: '蓝图为空 (请框选建筑而非地形)!' },
  'save_blueprint_title': { en: 'Save Blueprint', zh: '保存蓝图' },
  'save': { en: 'Save', zh: '保存' },
  'cancel': { en: 'Cancel', zh: '取消' },
  'empty': { en: 'Empty', zh: '空' },
  'mount': { en: 'Press F to Ride', zh: '按 F 乘坐' },
  'place_blueprint': { en: 'Placed Blueprint', zh: '已放置蓝图' },
  'missing_mats': { en: 'Missing Materials', zh: '材料不足' },
  'house_small': { en: 'Small Shelter', zh: '小型避难所' },
  'logic_clock': { en: 'Clock Circuit', zh: '时钟电路' },
  'garden_plot': { en: 'Garden Plot', zh: '花园地块' },
  
  // Editor Strings
  'configure_gate': { en: 'Configure Gate', zh: '配置逻辑门' },
  'save_to_backpack': { en: 'Save to Backpack', zh: '保存到背包' },
  'inputs': { en: 'Inputs', zh: '输入' },
  'outputs': { en: 'Outputs', zh: '输出' },
  'mode_none': { en: 'None', zh: '无' },
  'mode_input': { en: 'Input', zh: '输入' },
  'mode_output': { en: 'Output', zh: '输出' },
  'error_min_inputs': { en: 'Gates need at least 2 inputs', zh: '逻辑门至少需要2个输入' },
  'custom_item_saved': { en: 'Item Saved to Backpack!', zh: '物品已保存到背包!' },
  'backpack_title': { en: 'Saved Items', zh: '已保存物品' },

  // Categories
  'cat_TOOLS': { en: 'Tools', zh: '工具' },
  'cat_STRUCTURES': { en: 'Structures', zh: '建筑' },
  'cat_LOGIC': { en: 'Logic', zh: '逻辑' },
  'cat_MECHANISMS': { en: 'Mechanisms', zh: '机械' },

  [TileType.GRASS]: { en: 'Grass', zh: '草地' },
  [TileType.WATER]: { en: 'Water', zh: '水' },
  [TileType.SAND]: { en: 'Sand', zh: '沙子' },
  [TileType.TREE]: { en: 'Tree', zh: '树木' },
  [TileType.STONE]: { en: 'Stone', zh: '石头' },
  [TileType.WALL]: { en: 'Wall', zh: '墙壁' },
  [TileType.FLOWER]: { en: 'Flower', zh: '花' },
  [TileType.FLOOR]: { en: 'Floor', zh: '地板' },
  [TileType.WOOD]: { en: 'Wood', zh: '木头' },
  [TileType.AXE]: { en: 'Axe', zh: '斧头' },
  [TileType.PICKAXE]: { en: 'Pickaxe', zh: '镐' },
  [TileType.RAIL]: { en: 'Rail', zh: '铁轨' },
  [TileType.MINECART]: { en: 'Minecart', zh: '矿车' },
  [TileType.WIRE]: { en: 'Wire', zh: '电线' },
  [TileType.LEVER]: { en: 'Lever', zh: '拉杆' },
  [TileType.LAMP]: { en: 'Lamp', zh: '灯' },
  [TileType.LAMP_ON]: { en: 'Lamp (On)', zh: '灯(亮)' },
  [TileType.ROBOT]: { en: 'Auto-Bot', zh: '机器人' },
  [TileType.SAPLING]: { en: 'Sapling', zh: '树苗' },
  [TileType.AND_GATE]: { en: 'AND Gate', zh: '与门' },
  [TileType.OR_GATE]: { en: 'OR Gate', zh: '或门' },
  [TileType.NOT_GATE]: { en: 'NOT Gate', zh: '非门' },
};

export const TILE_COLORS: Record<TileType, string> = {
  [TileType.GRASS]: '#4ade80',
  [TileType.WATER]: '#38bdf8',
  [TileType.SAND]: '#fde047',
  [TileType.TREE]: '#166534',
  [TileType.STONE]: '#9ca3af',
  [TileType.WALL]: '#78350f',
  [TileType.FLOWER]: '#f472b6',
  [TileType.FLOOR]: '#d6d3d1',
  [TileType.WOOD]: '#a8a29e',
  [TileType.AXE]: '#ef4444',
  [TileType.PICKAXE]: '#3b82f6',
  [TileType.RAIL]: '#525252',
  [TileType.MINECART]: '#475569',
  [TileType.WIRE]: '#dc2626', // Redstone color
  [TileType.LEVER]: '#854d0e',
  [TileType.LAMP]: '#4b5563',
  [TileType.LAMP_ON]: '#fbbf24',
  [TileType.ROBOT]: '#0ea5e9',
  [TileType.SAPLING]: '#22c55e',
  [TileType.AND_GATE]: '#374151',
  [TileType.OR_GATE]: '#374151',
  [TileType.NOT_GATE]: '#374151',
};

export const COLLISION_TILES = new Set([
  TileType.WATER,
  TileType.TREE,
  TileType.STONE,
  TileType.WALL,
  TileType.LAMP,
  TileType.LAMP_ON,
  TileType.AND_GATE,
  TileType.OR_GATE,
  TileType.NOT_GATE
]);

export const INTERACTABLE_TILES = new Set([
  TileType.TREE,
  TileType.STONE,
  TileType.WALL,
  TileType.FLOWER,
  TileType.LEVER,
  TileType.RAIL,
  TileType.LAMP,
  TileType.LAMP_ON,
  TileType.AND_GATE,
  TileType.OR_GATE,
  TileType.NOT_GATE
]);

export const PLACEABLE_TILES = new Set([
  TileType.WALL,
  TileType.FLOOR,
  TileType.TREE,
  TileType.FLOWER,
  TileType.RAIL,
  TileType.WIRE,
  TileType.LEVER,
  TileType.LAMP,
  TileType.MINECART,
  TileType.ROBOT,
  TileType.SAPLING,
  TileType.AND_GATE,
  TileType.OR_GATE,
  TileType.NOT_GATE
]);

export const TOOLS = new Set([
  TileType.AXE,
  TileType.PICKAXE
]);

export const BLUEPRINT_IGNORED_TILES = new Set([
    TileType.GRASS,
    TileType.WATER,
    TileType.SAND
]);

// Mining Logic
export const MINE_REQUIREMENTS: Partial<Record<TileType, { requiredTool: TileType | null; minDuration: number }>> = {
  [TileType.TREE]: { requiredTool: null, minDuration: 1000 },
  [TileType.STONE]: { requiredTool: TileType.PICKAXE, minDuration: 500 },
  [TileType.WALL]: { requiredTool: TileType.AXE, minDuration: 500 },
  [TileType.FLOWER]: { requiredTool: null, minDuration: 0 },
  [TileType.RAIL]: { requiredTool: TileType.PICKAXE, minDuration: 200 },
  [TileType.WIRE]: { requiredTool: null, minDuration: 0 },
  [TileType.LEVER]: { requiredTool: null, minDuration: 200 },
  [TileType.LAMP]: { requiredTool: TileType.PICKAXE, minDuration: 200 },
  [TileType.LAMP_ON]: { requiredTool: TileType.PICKAXE, minDuration: 200 },
  [TileType.SAPLING]: { requiredTool: null, minDuration: 0 },
  [TileType.AND_GATE]: { requiredTool: TileType.PICKAXE, minDuration: 500 },
  [TileType.OR_GATE]: { requiredTool: TileType.PICKAXE, minDuration: 500 },
  [TileType.NOT_GATE]: { requiredTool: TileType.PICKAXE, minDuration: 500 },
};

// Loot Table
export const LOOT_TABLE: Partial<Record<TileType, { item: TileType; count: number }>> = {
  [TileType.TREE]: { item: TileType.WOOD, count: 2 }, 
  [TileType.STONE]: { item: TileType.STONE, count: 2 },
  [TileType.WALL]: { item: TileType.WOOD, count: 1 },
  [TileType.FLOWER]: { item: TileType.FLOWER, count: 1 },
  [TileType.RAIL]: { item: TileType.RAIL, count: 1 },
  [TileType.WIRE]: { item: TileType.WIRE, count: 1 },
  [TileType.LEVER]: { item: TileType.LEVER, count: 1 },
  [TileType.LAMP]: { item: TileType.LAMP, count: 1 },
  [TileType.LAMP_ON]: { item: TileType.LAMP, count: 1 },
  [TileType.SAPLING]: { item: TileType.SAPLING, count: 1 },
  [TileType.AND_GATE]: { item: TileType.AND_GATE, count: 1 },
  [TileType.OR_GATE]: { item: TileType.OR_GATE, count: 1 },
  [TileType.NOT_GATE]: { item: TileType.NOT_GATE, count: 1 },
};

// Crafting Recipes
export const RECIPES: Recipe[] = [
  {
    output: TileType.AXE,
    count: 1,
    category: 'TOOLS',
    ingredients: [
      { type: TileType.WOOD, count: 3 },
      { type: TileType.STONE, count: 2 }
    ]
  },
  {
    output: TileType.PICKAXE,
    count: 1,
    category: 'TOOLS',
    ingredients: [
      { type: TileType.WOOD, count: 3 },
      { type: TileType.STONE, count: 3 }
    ]
  },
  {
    output: TileType.WALL,
    count: 1,
    category: 'STRUCTURES',
    ingredients: [
      { type: TileType.WOOD, count: 2 }
    ]
  },
  {
    output: TileType.FLOOR,
    count: 1,
    category: 'STRUCTURES',
    ingredients: [
      { type: TileType.STONE, count: 1 }
    ]
  },
  {
    output: TileType.RAIL,
    count: 4,
    category: 'STRUCTURES',
    ingredients: [
      { type: TileType.WOOD, count: 1 },
      { type: TileType.STONE, count: 1 }
    ]
  },
  {
    output: TileType.WIRE,
    count: 2,
    category: 'LOGIC',
    ingredients: [
      { type: TileType.WOOD, count: 1 },
      { type: TileType.SAND, count: 1 }
    ]
  },
  {
    output: TileType.LEVER,
    count: 1,
    category: 'LOGIC',
    ingredients: [
      { type: TileType.STONE, count: 1 },
      { type: TileType.WOOD, count: 1 }
    ]
  },
  {
    output: TileType.LAMP,
    count: 1,
    category: 'LOGIC',
    ingredients: [
      { type: TileType.STONE, count: 1 },
      { type: TileType.WIRE, count: 2 }
    ]
  },
  {
      output: TileType.AND_GATE,
      count: 1,
      category: 'LOGIC',
      ingredients: [
          { type: TileType.STONE, count: 3 },
          { type: TileType.WIRE, count: 2 }
      ]
  },
  {
      output: TileType.OR_GATE,
      count: 1,
      category: 'LOGIC',
      ingredients: [
          { type: TileType.STONE, count: 3 },
          { type: TileType.WIRE, count: 2 }
      ]
  },
  {
      output: TileType.NOT_GATE,
      count: 1,
      category: 'LOGIC',
      ingredients: [
          { type: TileType.STONE, count: 2 },
          { type: TileType.WIRE, count: 1 },
          { type: TileType.LAMP, count: 1 }
      ]
  },
  {
    output: TileType.MINECART,
    count: 1,
    category: 'MECHANISMS',
    ingredients: [
        { type: TileType.STONE, count: 5 }
    ]
  },
  {
    output: TileType.ROBOT,
    count: 1,
    category: 'MECHANISMS',
    ingredients: [
        { type: TileType.STONE, count: 5 },
        { type: TileType.WIRE, count: 5 },
        { type: TileType.LAMP, count: 1 }
    ]
  },
  {
      output: TileType.STONE,
      count: 1,
      category: 'STRUCTURES',
      ingredients: [
          { type: TileType.SAND, count: 2 }
      ]
  },
  {
      output: TileType.SAND,
      count: 2,
      category: 'STRUCTURES',
      ingredients: [
          { type: TileType.STONE, count: 1 }
      ]
  },
  {
      output: TileType.SAND,
      count: 1,
      category: 'STRUCTURES',
      ingredients: [
          { type: TileType.WOOD, count: 2 }
      ]
  }
];

export const DEFAULT_BLUEPRINTS: Blueprint[] = [
    {
        id: 'house_small',
        name: 'house_small',
        tiles: [
            { x: -2, y: -2, type: TileType.WALL }, { x: -1, y: -2, type: TileType.WALL }, { x: 0, y: -2, type: TileType.WALL }, { x: 1, y: -2, type: TileType.WALL }, { x: 2, y: -2, type: TileType.WALL },
            { x: -2, y: -1, type: TileType.WALL }, { x: -1, y: -1, type: TileType.FLOOR }, { x: 0, y: -1, type: TileType.FLOOR }, { x: 1, y: -1, type: TileType.FLOOR }, { x: 2, y: -1, type: TileType.WALL },
            { x: -2, y: 0, type: TileType.WALL }, { x: -1, y: 0, type: TileType.FLOOR }, { x: 0, y: 0, type: TileType.FLOOR }, { x: 1, y: 0, type: TileType.FLOOR }, { x: 2, y: 0, type: TileType.WALL },
            { x: -2, y: 1, type: TileType.WALL }, { x: -1, y: 1, type: TileType.FLOOR }, { x: 0, y: 1, type: TileType.FLOOR }, { x: 1, y: 1, type: TileType.FLOOR }, { x: 2, y: 1, type: TileType.WALL },
            { x: -2, y: 2, type: TileType.WALL }, { x: -1, y: 2, type: TileType.WALL }, { x: 0, y: 2, type: TileType.FLOOR }, { x: 1, y: 2, type: TileType.WALL }, { x: 2, y: 2, type: TileType.WALL },
            { x: -1, y: 1, type: TileType.LAMP }, { x: 1, y: 1, type: TileType.FLOWER }
        ]
    },
    {
        id: 'logic_clock',
        name: 'logic_clock',
        tiles: [
            // A simple 3-tick clock generator
            // Default NOT gate setup
            { x: 0, y: 0, type: TileType.NOT_GATE, variant: 1, ioConfig: 30 }, 
            { x: 1, y: 0, type: TileType.WIRE },
            { x: 2, y: 0, type: TileType.WIRE },
            { x: 2, y: 1, type: TileType.WIRE },
            { x: 1, y: 1, type: TileType.WIRE },
            { x: 0, y: 1, type: TileType.WIRE },
            { x: -1, y: 1, type: TileType.WIRE },
            { x: -1, y: 0, type: TileType.WIRE },
            { x: 3, y: 0, type: TileType.LAMP } // Output indicator
        ]
    },
    {
        id: 'garden_plot',
        name: 'garden_plot',
        tiles: [
            { x: 0, y: 0, type: TileType.WATER },
            { x: -1, y: 0, type: TileType.FLOWER }, { x: 1, y: 0, type: TileType.FLOWER },
            { x: 0, y: -1, type: TileType.FLOWER }, { x: 0, y: 1, type: TileType.FLOWER },
            { x: -1, y: -1, type: TileType.GRASS }, { x: 1, y: -1, type: TileType.GRASS },
            { x: -1, y: 1, type: TileType.GRASS }, { x: 1, y: 1, type: TileType.GRASS }
        ]
    }
];
