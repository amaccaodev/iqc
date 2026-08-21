import type {
  Machine,
  Product,
  ProductBomLine,
  SemiProduct,
  WarehouseStock,
} from "@shared/types";

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "p1",
    code: "NOVO-20-001",
    name: "Van 1 chiều lò xo NOVO 20",
    description: "Thành phẩm demo",
    active: true,
  },
  {
    id: "p2",
    code: "NOVO-VC-20",
    name: "Van cửa NOVO 20",
    description: "Theo ĐMKT van cửa",
    active: true,
  },
];

export const DEMO_SEMI: SemiProduct[] = [
  { id: "sp1", code: "BTP-BODY-20", name: "Thân van NOVO20", processStage: "hot_forge", description: "", active: true },
  { id: "sp2", code: "BTP-SPRING-20", name: "Lò xo NOVO20", processStage: "auto", description: "", active: true },
  { id: "sp3", code: "BTP-ASM-20", name: "Bộ lắp ráp NOVO20", processStage: "assembly", description: "", active: true },
  { id: "sp-vc-body", code: "VC20-THAN", name: "Thân van cửa NOVO 20", processStage: "hot_forge", description: "", active: true },
  { id: "sp-vc-cap", code: "VC20-NAP", name: "Nắp van cửa NOVO 20", processStage: "hot_forge", description: "", active: true },
  { id: "sp-vc-disc", code: "VC20-DIA", name: "Đĩa van cửa NOVO 20", processStage: "hot_forge", description: "", active: true },
  { id: "sp-vc-shaft", code: "VC20-TRUC", name: "Trục van cửa NOVO 20", processStage: "auto", description: "", active: true },
  { id: "sp-vc-nut", code: "VC20-OCAL", name: "Ốc áp lực van cửa NOVO 20", processStage: "auto", description: "", active: true },
  { id: "sp-vc-washer", code: "VC20-OCDT8", name: "Ốc đệm T8", processStage: "auto", description: "", active: true },
];

export const DEMO_PRODUCT_BOMS: ProductBomLine[] = [
  { id: "pb1", productId: "p1", semiProductId: "sp1", qtyPerUnit: 1 },
  { id: "pb2", productId: "p1", semiProductId: "sp2", qtyPerUnit: 1 },
  { id: "pb3", productId: "p1", semiProductId: "sp3", qtyPerUnit: 1 },
  { id: "pb-vc1", productId: "p2", semiProductId: "sp-vc-body", qtyPerUnit: 1 },
  { id: "pb-vc2", productId: "p2", semiProductId: "sp-vc-cap", qtyPerUnit: 1 },
  { id: "pb-vc3", productId: "p2", semiProductId: "sp-vc-disc", qtyPerUnit: 1 },
  { id: "pb-vc4", productId: "p2", semiProductId: "sp-vc-shaft", qtyPerUnit: 1 },
  { id: "pb-vc5", productId: "p2", semiProductId: "sp-vc-nut", qtyPerUnit: 1 },
  { id: "pb-vc6", productId: "p2", semiProductId: "sp-vc-washer", qtyPerUnit: 1 },
];

export const DEMO_WAREHOUSE: WarehouseStock[] = [
  { semiProductId: "sp1", qty: 120 },
  { semiProductId: "sp2", qty: 80 },
  { semiProductId: "sp3", qty: 50 },
  { semiProductId: "sp-vc-body", qty: 40 },
  { semiProductId: "sp-vc-cap", qty: 35 },
  { semiProductId: "sp-vc-disc", qty: 30 },
  { semiProductId: "sp-vc-shaft", qty: 55 },
  { semiProductId: "sp-vc-nut", qty: 80 },
  { semiProductId: "sp-vc-washer", qty: 70 },
];

export const DEMO_MACHINES: Machine[] = [
  {
    id: "m1",
    code: "CAM-01",
    name: "Cam 0.1",
    params: [{ label: "ĐK ngoài", unit: "mm", min: 19.9, max: 20.1 }],
    active: true,
  },
  {
    id: "m2",
    code: "CNC-01",
    name: "Tiện CNC 1",
    params: [{ label: "Chiều dài", unit: "mm", min: 49.5, max: 50.5 }],
    active: true,
  },
];
