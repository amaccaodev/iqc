/** Auto-generated from documents/*.xlsx — `python scripts/import_dmkt.py` */
import type {
  Bom,
  BomProcess,
  Machine,
  Product,
  SemiProduct,
  WarehouseStock,
} from "../types/index.js";

export const DMKT_PRODUCTS: Product[] = [
  {
    "id": "p1",
    "code": "NOVO-VG-15",
    "name": "Van góc 1C sau ĐH NOVO 15 tay ABS",
    "description": "Import ĐMKT 1 - VAN GÓC 1C SAU ĐH NOVO 15 TAY ABS.xlsx",
    "unitOfMeasureId": "uom-pcs",
    "active": true
  },
  {
    "id": "p2",
    "code": "NOVO-VC-20",
    "name": "Van cửa NOVO 20",
    "description": "Import ĐMKT 2-VAN CỬA NOVO 20.xlsx",
    "unitOfMeasureId": "uom-pcs",
    "active": true
  },
  {
    "id": "p3",
    "code": "NOVO-VB-15-ABS",
    "name": "Van bi NOVO 15 tay ABS",
    "description": "Import ĐMKT 1-VAN BI NOVO 15 TAY ABS.xlsx",
    "unitOfMeasureId": "uom-pcs",
    "active": true
  },
  {
    "id": "p4",
    "code": "KUMA-15-TKM",
    "name": "Vòi KUMA 15 tay gạt K1 xanh TKM",
    "description": "Import ĐMKT 1.1 - VÒI KUMA 15 TKM.xls",
    "unitOfMeasureId": "uom-pcs",
    "active": true
  },
  {
    "id": "p5",
    "code": "NOVO-VG-15-KHOA",
    "name": "Van góc 1C sau ĐH NOVO 15 tay khóa",
    "description": "Import ĐMKT 2 - VAN GÓC 1C SAU ĐH NOVO 15 TAY KHÓA.xlsx",
    "unitOfMeasureId": "uom-pcs",
    "active": true
  },
  {
    "id": "p6",
    "code": "NOVO-VG-15-LH",
    "name": "Van góc LH 1C NOVO 15 tay hợp kim",
    "description": "Import ĐMKT 5.1 - VAN GÓC LH 1C NOVO 15 TAY HK.xlsx",
    "unitOfMeasureId": "uom-pcs",
    "active": true
  }
];

export const DMKT_SEMI: SemiProduct[] = [
  {
    "id": "sp-novo-vg-15-01",
    "code": "NOVO-VG-15-NAP",
    "name": "Nắp van góc novo 15",
    "productId": "p1",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-02",
    "code": "NOVO-VG-15-THAN",
    "name": "Thân van góc 1C sau ĐH novo 15",
    "productId": "p1",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-03",
    "code": "NOVO-VG-15-TRUC",
    "name": "Trục Van bi tay ABS NOVO (KUMA) 20 (Van góc LH, Van góc tay ABS Novo 15)",
    "productId": "p1",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-04",
    "code": "NOVO-VG-15-OCAL",
    "name": "Ốc áp lực van bi Novo 15, 20, van góc, bi liên hợp, vòi Novo, Kuma15-20",
    "productId": "p1",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-05",
    "code": "NOVO-VG-15-05",
    "name": "Đai ốc 1 van góc Novo 15 ( van góc LH 1 chiều Novo 15)",
    "productId": "p1",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-06",
    "code": "NOVO-VG-15-06",
    "name": "Đĩa van góc 1 chiều sau ĐH novo 15",
    "productId": "p1",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-07",
    "code": "NOVO-VG-15-07",
    "name": "Đệm hãm đĩa van góc 1 chiều, liên hợp 1 chiều Novo 15 (TKM)",
    "productId": "p1",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vb-15-abs-01",
    "code": "NOVO-VB-15-ABS-NAP",
    "name": "Nắp van bi novo 15",
    "productId": "p3",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vb-15-abs-02",
    "code": "NOVO-VB-15-ABS-THAN",
    "name": "Thân van bi novo 15",
    "productId": "p3",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vb-15-abs-03",
    "code": "NOVO-VB-15-ABS-TRUC",
    "name": "Trục Van bi tay ABS KUMA, NOVO 15 ( góc Novo Plus 15, 7D Novo Plus 15)",
    "productId": "p3",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vb-15-abs-04",
    "code": "NOVO-VB-15-ABS-OCAL",
    "name": "Ốc áp lực van bi Novo 15, 20, van góc, bi liên hợp, vòi Novo, novo15-20",
    "productId": "p3",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vb-15-abs-05",
    "code": "NOVO-VB-15-ABS-05",
    "name": "van bi novo 15 tay ABS",
    "productId": "p3",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-kuma-15-tkm-01",
    "code": "KUMA-15-TKM-NAP",
    "name": "Nắp vòi kuma 15",
    "productId": "p4",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-kuma-15-tkm-02",
    "code": "KUMA-15-TKM-THAN",
    "name": "Thân vòi kuma 15 TKM",
    "productId": "p4",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-kuma-15-tkm-03",
    "code": "KUMA-15-TKM-03",
    "name": "Đầu vòi Misu (TKC), Novo 15, Kuma 15, Việt tiệp 15",
    "productId": "p4",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-kuma-15-tkm-04",
    "code": "KUMA-15-TKM-TRUC",
    "name": "Trục vòi Kuma 15 TKM",
    "productId": "p4",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-kuma-15-tkm-05",
    "code": "KUMA-15-TKM-05",
    "name": "Vòi kuma 15 TKM",
    "productId": "p4",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-khoa-01",
    "code": "NOVO-VG-15-KHOA-NAP",
    "name": "Nắp van góc novo 15",
    "productId": "p5",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-khoa-02",
    "code": "NOVO-VG-15-KHOA-THAN",
    "name": "Thân van góc 1C sau ĐH novo 15",
    "productId": "p5",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-khoa-03",
    "code": "NOVO-VG-15-KHOA-TRUC",
    "name": "Trục van góc Novo 15 tay khóa (Trục van bi Novo 15 tay khóa)",
    "productId": "p5",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-khoa-04",
    "code": "NOVO-VG-15-KHOA-OCAL",
    "name": "Ốc áp lực van bi Novo 15, 20, van góc, bi liên hợp, vòi Novo, Kuma15-20",
    "productId": "p5",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-khoa-05",
    "code": "NOVO-VG-15-KHOA-05",
    "name": "Đai ốc 1 van góc Novo 15 ( van góc LH 1 chiều Novo 15)",
    "productId": "p5",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-khoa-06",
    "code": "NOVO-VG-15-KHOA-06",
    "name": "Đĩa van góc 1 chiều sau ĐH novo 15",
    "productId": "p5",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-khoa-07",
    "code": "NOVO-VG-15-KHOA-07",
    "name": "Đệm hãm đĩa van góc 1 chiều, liên hợp 1 chiều Novo 15 (TKM)",
    "productId": "p5",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vc-20-01",
    "code": "NOVO-VC-20-NAP",
    "name": "Nắp van cửa novo 20",
    "productId": "p2",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vc-20-02",
    "code": "NOVO-VC-20-THAN",
    "name": "Thân van cửa novo 20",
    "productId": "p2",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vc-20-03",
    "code": "NOVO-VC-20-03",
    "name": "Đĩa van cửa novo 20",
    "productId": "p2",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vc-20-04",
    "code": "NOVO-VC-20-TRUC",
    "name": "Trục van cửa novo 20",
    "productId": "p2",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vc-20-05",
    "code": "NOVO-VC-20-OCAL",
    "name": "Ốc áp lực van cửa novo 20",
    "productId": "p2",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vc-20-06",
    "code": "NOVO-VC-20-06",
    "name": "Ốc đệm T8 (Van cửa Novo 25, Kuma, Tam Kim 25, CAX 20-25)",
    "productId": "p2",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vc-20-07",
    "code": "NOVO-VC-20-TRUC-07",
    "name": "Đệm trục T8 (Van cửa Novo 20, 25, Việt Tiệp 20,25)",
    "productId": "p2",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-lh-01",
    "code": "NOVO-VG-15-LH-NAP",
    "name": "Nắp van góc 1 chiều trước đồng hồ, liên hợp 1 chiều Novo 15 TKM",
    "productId": "p6",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-lh-02",
    "code": "NOVO-VG-15-LH-THAN",
    "name": "Thân van góc LH novo 15 TKM",
    "productId": "p6",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-lh-03",
    "code": "NOVO-VG-15-LH-TRUC",
    "name": "Trục Van bi tay ABS NOVO (KUMA) 20 (Van góc LH, Van góc tay ABS Novo 15)",
    "productId": "p6",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-lh-04",
    "code": "NOVO-VG-15-LH-OCAL",
    "name": "Ốc áp lực van bi Novo 15, 20, van góc, bi liên hợp, vòi Novo, Kuma15-20",
    "productId": "p6",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-lh-05",
    "code": "NOVO-VG-15-LH-05",
    "name": "Đai ốc 1 van góc Novo 15 ( van góc LH 1 chiều Novo 15)",
    "productId": "p6",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-lh-06",
    "code": "NOVO-VG-15-LH-06",
    "name": "Đai ốc 2 van góc liên hợp Novo 15 (van bi LH Novo 20) TKM",
    "productId": "p6",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "float",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-lh-07",
    "code": "NOVO-VG-15-LH-07",
    "name": "Đệm hãm đĩa van góc 1 chiều, liên hợp 1 chiều Novo 15 (TKM)",
    "productId": "p6",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-lh-08",
    "code": "NOVO-VG-15-LH-08",
    "name": "Đĩa van góc 1 chiều trước đồng hồ, van góc liên hợp Novo 15 TKM",
    "productId": "p6",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  },
  {
    "id": "sp-novo-vg-15-lh-09",
    "code": "NOVO-VG-15-LH-09",
    "name": "Vòng đệm van góc liên hợp Novo 15 ( van bi liên hợp Novo 20) (TKM)",
    "productId": "p6",
    "unitOfMeasureId": "uom-pcs",
    "measurementSpecs": {
      "A": "text",
      "B": "boolean"
    },
    "active": true
  }
];

export const DMKT_BOMS: Bom[] = [
  {
    "id": "bom-sp-novo-vg-15-01",
    "name": "BOM Nắp van góc novo 15",
    "semiProductId": "sp-novo-vg-15-01"
  },
  {
    "id": "bom-sp-novo-vg-15-02",
    "name": "BOM Thân van góc 1C sau ĐH novo 15",
    "semiProductId": "sp-novo-vg-15-02"
  },
  {
    "id": "bom-sp-novo-vg-15-03",
    "name": "BOM Trục Van bi tay ABS NOVO (KUMA) 20 (Van góc LH, Van góc tay ABS Novo 15)",
    "semiProductId": "sp-novo-vg-15-03"
  },
  {
    "id": "bom-sp-novo-vg-15-04",
    "name": "BOM Ốc áp lực van bi Novo 15, 20, van góc, bi liên hợp, vòi Novo, Kuma15-20",
    "semiProductId": "sp-novo-vg-15-04"
  },
  {
    "id": "bom-sp-novo-vg-15-05",
    "name": "BOM Đai ốc 1 van góc Novo 15 ( van góc LH 1 chiều Novo 15)",
    "semiProductId": "sp-novo-vg-15-05"
  },
  {
    "id": "bom-sp-novo-vg-15-06",
    "name": "BOM Đĩa van góc 1 chiều sau ĐH novo 15",
    "semiProductId": "sp-novo-vg-15-06"
  },
  {
    "id": "bom-sp-novo-vg-15-07",
    "name": "BOM Đệm hãm đĩa van góc 1 chiều, liên hợp 1 chiều Novo 15 (TKM)",
    "semiProductId": "sp-novo-vg-15-07"
  },
  {
    "id": "bom-sp-novo-vb-15-abs-01",
    "name": "BOM Nắp van bi novo 15",
    "semiProductId": "sp-novo-vb-15-abs-01"
  },
  {
    "id": "bom-sp-novo-vb-15-abs-02",
    "name": "BOM Thân van bi novo 15",
    "semiProductId": "sp-novo-vb-15-abs-02"
  },
  {
    "id": "bom-sp-novo-vb-15-abs-03",
    "name": "BOM Trục Van bi tay ABS KUMA, NOVO 15 ( góc Novo Plus 15, 7D Novo Plus 15)",
    "semiProductId": "sp-novo-vb-15-abs-03"
  },
  {
    "id": "bom-sp-novo-vb-15-abs-04",
    "name": "BOM Ốc áp lực van bi Novo 15, 20, van góc, bi liên hợp, vòi Novo, novo15-20",
    "semiProductId": "sp-novo-vb-15-abs-04"
  },
  {
    "id": "bom-sp-novo-vb-15-abs-05",
    "name": "BOM van bi novo 15 tay ABS",
    "semiProductId": "sp-novo-vb-15-abs-05"
  },
  {
    "id": "bom-sp-kuma-15-tkm-01",
    "name": "BOM Nắp vòi kuma 15",
    "semiProductId": "sp-kuma-15-tkm-01"
  },
  {
    "id": "bom-sp-kuma-15-tkm-02",
    "name": "BOM Thân vòi kuma 15 TKM",
    "semiProductId": "sp-kuma-15-tkm-02"
  },
  {
    "id": "bom-sp-kuma-15-tkm-03",
    "name": "BOM Đầu vòi Misu (TKC), Novo 15, Kuma 15, Việt tiệp 15",
    "semiProductId": "sp-kuma-15-tkm-03"
  },
  {
    "id": "bom-sp-kuma-15-tkm-04",
    "name": "BOM Trục vòi Kuma 15 TKM",
    "semiProductId": "sp-kuma-15-tkm-04"
  },
  {
    "id": "bom-sp-kuma-15-tkm-05",
    "name": "BOM Vòi kuma 15 TKM",
    "semiProductId": "sp-kuma-15-tkm-05"
  },
  {
    "id": "bom-sp-novo-vg-15-khoa-01",
    "name": "BOM Nắp van góc novo 15",
    "semiProductId": "sp-novo-vg-15-khoa-01"
  },
  {
    "id": "bom-sp-novo-vg-15-khoa-02",
    "name": "BOM Thân van góc 1C sau ĐH novo 15",
    "semiProductId": "sp-novo-vg-15-khoa-02"
  },
  {
    "id": "bom-sp-novo-vg-15-khoa-03",
    "name": "BOM Trục van góc Novo 15 tay khóa (Trục van bi Novo 15 tay khóa)",
    "semiProductId": "sp-novo-vg-15-khoa-03"
  },
  {
    "id": "bom-sp-novo-vg-15-khoa-04",
    "name": "BOM Ốc áp lực van bi Novo 15, 20, van góc, bi liên hợp, vòi Novo, Kuma15-20",
    "semiProductId": "sp-novo-vg-15-khoa-04"
  },
  {
    "id": "bom-sp-novo-vg-15-khoa-05",
    "name": "BOM Đai ốc 1 van góc Novo 15 ( van góc LH 1 chiều Novo 15)",
    "semiProductId": "sp-novo-vg-15-khoa-05"
  },
  {
    "id": "bom-sp-novo-vg-15-khoa-06",
    "name": "BOM Đĩa van góc 1 chiều sau ĐH novo 15",
    "semiProductId": "sp-novo-vg-15-khoa-06"
  },
  {
    "id": "bom-sp-novo-vg-15-khoa-07",
    "name": "BOM Đệm hãm đĩa van góc 1 chiều, liên hợp 1 chiều Novo 15 (TKM)",
    "semiProductId": "sp-novo-vg-15-khoa-07"
  },
  {
    "id": "bom-sp-novo-vc-20-01",
    "name": "BOM Nắp van cửa novo 20",
    "semiProductId": "sp-novo-vc-20-01"
  },
  {
    "id": "bom-sp-novo-vc-20-02",
    "name": "BOM Thân van cửa novo 20",
    "semiProductId": "sp-novo-vc-20-02"
  },
  {
    "id": "bom-sp-novo-vc-20-03",
    "name": "BOM Đĩa van cửa novo 20",
    "semiProductId": "sp-novo-vc-20-03"
  },
  {
    "id": "bom-sp-novo-vc-20-04",
    "name": "BOM Trục van cửa novo 20",
    "semiProductId": "sp-novo-vc-20-04"
  },
  {
    "id": "bom-sp-novo-vc-20-05",
    "name": "BOM Ốc áp lực van cửa novo 20",
    "semiProductId": "sp-novo-vc-20-05"
  },
  {
    "id": "bom-sp-novo-vc-20-06",
    "name": "BOM Ốc đệm T8 (Van cửa Novo 25, Kuma, Tam Kim 25, CAX 20-25)",
    "semiProductId": "sp-novo-vc-20-06"
  },
  {
    "id": "bom-sp-novo-vc-20-07",
    "name": "BOM Đệm trục T8 (Van cửa Novo 20, 25, Việt Tiệp 20,25)",
    "semiProductId": "sp-novo-vc-20-07"
  },
  {
    "id": "bom-sp-novo-vg-15-lh-01",
    "name": "BOM Nắp van góc 1 chiều trước đồng hồ, liên hợp 1 chiều Novo 15 TKM",
    "semiProductId": "sp-novo-vg-15-lh-01"
  },
  {
    "id": "bom-sp-novo-vg-15-lh-02",
    "name": "BOM Thân van góc LH novo 15 TKM",
    "semiProductId": "sp-novo-vg-15-lh-02"
  },
  {
    "id": "bom-sp-novo-vg-15-lh-03",
    "name": "BOM Trục Van bi tay ABS NOVO (KUMA) 20 (Van góc LH, Van góc tay ABS Novo 15)",
    "semiProductId": "sp-novo-vg-15-lh-03"
  },
  {
    "id": "bom-sp-novo-vg-15-lh-04",
    "name": "BOM Ốc áp lực van bi Novo 15, 20, van góc, bi liên hợp, vòi Novo, Kuma15-20",
    "semiProductId": "sp-novo-vg-15-lh-04"
  },
  {
    "id": "bom-sp-novo-vg-15-lh-05",
    "name": "BOM Đai ốc 1 van góc Novo 15 ( van góc LH 1 chiều Novo 15)",
    "semiProductId": "sp-novo-vg-15-lh-05"
  },
  {
    "id": "bom-sp-novo-vg-15-lh-06",
    "name": "BOM Đai ốc 2 van góc liên hợp Novo 15 (van bi LH Novo 20) TKM",
    "semiProductId": "sp-novo-vg-15-lh-06"
  },
  {
    "id": "bom-sp-novo-vg-15-lh-07",
    "name": "BOM Đệm hãm đĩa van góc 1 chiều, liên hợp 1 chiều Novo 15 (TKM)",
    "semiProductId": "sp-novo-vg-15-lh-07"
  },
  {
    "id": "bom-sp-novo-vg-15-lh-08",
    "name": "BOM Đĩa van góc 1 chiều trước đồng hồ, van góc liên hợp Novo 15 TKM",
    "semiProductId": "sp-novo-vg-15-lh-08"
  },
  {
    "id": "bom-sp-novo-vg-15-lh-09",
    "name": "BOM Vòng đệm van góc liên hợp Novo 15 ( van bi liên hợp Novo 20) (TKM)",
    "semiProductId": "sp-novo-vg-15-lh-09"
  }
];

export const DMKT_BOM_PROCESSES: BomProcess[] = [
  {
    "id": "bp-sp-novo-vg-15-01-1",
    "bomId": "bom-sp-novo-vg-15-01",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-01-2",
    "bomId": "bom-sp-novo-vg-15-01",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 4000,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-01-3",
    "bomId": "bom-sp-novo-vg-15-01",
    "name": "3: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-novo-vg-15-01-4",
    "bomId": "bom-sp-novo-vg-15-01",
    "name": "4: Hoàn thiện",
    "productionTeamId": "t_auto",
    "machineGroupId": "mg_auto",
    "quotaPerShift": 3500,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-novo-vg-15-02-1",
    "bomId": "bom-sp-novo-vg-15-02",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-02-2",
    "bomId": "bom-sp-novo-vg-15-02",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 3300,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-02-3",
    "bomId": "bom-sp-novo-vg-15-02",
    "name": "3: Dập bavia",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 4500,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-novo-vg-15-02-4",
    "bomId": "bom-sp-novo-vg-15-02",
    "name": "4: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-novo-vg-15-02-5",
    "bomId": "bom-sp-novo-vg-15-02",
    "name": "5: Khoan phá",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 4000,
    "sortOrder": 5
  },
  {
    "id": "bp-sp-novo-vg-15-02-6",
    "bomId": "bom-sp-novo-vg-15-02",
    "name": "6: Gia công 123",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 1000,
    "sortOrder": 6
  },
  {
    "id": "bp-sp-novo-vg-15-02-7",
    "bomId": "bom-sp-novo-vg-15-02",
    "name": "7: Sấn rãnh",
    "productionTeamId": "t_auto",
    "machineGroupId": "mg_auto",
    "quotaPerShift": 1500,
    "sortOrder": 7
  },
  {
    "id": "bp-sp-novo-vg-15-02-8",
    "bomId": "bom-sp-novo-vg-15-02",
    "name": "8: Móc gờ trục",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 2100,
    "sortOrder": 8
  },
  {
    "id": "bp-sp-novo-vg-15-02-9",
    "bomId": "bom-sp-novo-vg-15-02",
    "name": "9: Khoan lỗ kẹp trì",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 6000,
    "sortOrder": 9
  },
  {
    "id": "bp-sp-novo-vg-15-03-1",
    "bomId": "bom-sp-novo-vg-15-03",
    "name": "1: Gia công",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 1543,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-03-2",
    "bomId": "bom-sp-novo-vg-15-03",
    "name": "2: Phay giác",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 4200,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-04-1",
    "bomId": "bom-sp-novo-vg-15-04",
    "name": "1: Gia công",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 2094,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-05-1",
    "bomId": "bom-sp-novo-vg-15-05",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-05-2",
    "bomId": "bom-sp-novo-vg-15-05",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 5513,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-05-3",
    "bomId": "bom-sp-novo-vg-15-05",
    "name": "3: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-novo-vg-15-05-4",
    "bomId": "bom-sp-novo-vg-15-05",
    "name": "4: Gia công ren ống",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 2520,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-novo-vg-15-05-5",
    "bomId": "bom-sp-novo-vg-15-05",
    "name": "5: Khoan lỗ kẹp chì",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 2700,
    "sortOrder": 5
  },
  {
    "id": "bp-sp-novo-vg-15-06-1",
    "bomId": "bom-sp-novo-vg-15-06",
    "name": "1: Gia công",
    "productionTeamId": "t_auto",
    "machineGroupId": "mg_auto",
    "quotaPerShift": 500,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-06-2",
    "bomId": "bom-sp-novo-vg-15-06",
    "name": "2: Khỏa mặt",
    "productionTeamId": "t_auto",
    "machineGroupId": "mg_auto",
    "quotaPerShift": 1200,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-07-1",
    "bomId": "bom-sp-novo-vg-15-07",
    "name": "1: Gia công",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 1102,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-07-2",
    "bomId": "bom-sp-novo-vg-15-07",
    "name": "2: Khoả mặt",
    "productionTeamId": "t_auto",
    "machineGroupId": "mg_auto",
    "quotaPerShift": 2600,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vb-15-abs-01-1",
    "bomId": "bom-sp-novo-vb-15-abs-01",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vb-15-abs-01-2",
    "bomId": "bom-sp-novo-vb-15-abs-01",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 4000,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vb-15-abs-01-3",
    "bomId": "bom-sp-novo-vb-15-abs-01",
    "name": "3: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-novo-vb-15-abs-01-4",
    "bomId": "bom-sp-novo-vb-15-abs-01",
    "name": "4: Hoàn thiện",
    "productionTeamId": "t_auto",
    "machineGroupId": "mg_auto",
    "quotaPerShift": 3500,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-novo-vb-15-abs-02-1",
    "bomId": "bom-sp-novo-vb-15-abs-02",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vb-15-abs-02-2",
    "bomId": "bom-sp-novo-vb-15-abs-02",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 4500,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vb-15-abs-02-3",
    "bomId": "bom-sp-novo-vb-15-abs-02",
    "name": "3: Dập bavia",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 5000,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-novo-vb-15-abs-02-4",
    "bomId": "bom-sp-novo-vb-15-abs-02",
    "name": "4: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-novo-vb-15-abs-02-5",
    "bomId": "bom-sp-novo-vb-15-abs-02",
    "name": "5: Gia công 123",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 2500,
    "sortOrder": 5
  },
  {
    "id": "bp-sp-novo-vb-15-abs-03-1",
    "bomId": "bom-sp-novo-vb-15-abs-03",
    "name": "1: Gia công",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 3500,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vb-15-abs-03-2",
    "bomId": "bom-sp-novo-vb-15-abs-03",
    "name": "2: Phay giác",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 3200,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vb-15-abs-04-1",
    "bomId": "bom-sp-novo-vb-15-abs-04",
    "name": "1: Gia công",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 3500,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vb-15-abs-05-1",
    "bomId": "bom-sp-novo-vb-15-abs-05",
    "name": "Lắp ráp",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 800,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vb-15-abs-05-2",
    "bomId": "bom-sp-novo-vb-15-abs-05",
    "name": "Bao gói",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 0,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-kuma-15-tkm-01-1",
    "bomId": "bom-sp-kuma-15-tkm-01",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-kuma-15-tkm-01-2",
    "bomId": "bom-sp-kuma-15-tkm-01",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 4500,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-kuma-15-tkm-01-3",
    "bomId": "bom-sp-kuma-15-tkm-01",
    "name": "3: Dập bavia",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 5200,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-kuma-15-tkm-01-4",
    "bomId": "bom-sp-kuma-15-tkm-01",
    "name": "4: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-kuma-15-tkm-01-5",
    "bomId": "bom-sp-kuma-15-tkm-01",
    "name": "5: Gia công ren ống + ren lắp ráp",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 2500,
    "sortOrder": 5
  },
  {
    "id": "bp-sp-kuma-15-tkm-02-1",
    "bomId": "bom-sp-kuma-15-tkm-02",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-kuma-15-tkm-02-2",
    "bomId": "bom-sp-kuma-15-tkm-02",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 3200,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-kuma-15-tkm-02-3",
    "bomId": "bom-sp-kuma-15-tkm-02",
    "name": "3: Dập bavia",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 4500,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-kuma-15-tkm-02-4",
    "bomId": "bom-sp-kuma-15-tkm-02",
    "name": "4: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-kuma-15-tkm-02-5",
    "bomId": "bom-sp-kuma-15-tkm-02",
    "name": "5: Khoan phá",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 2000,
    "sortOrder": 5
  },
  {
    "id": "bp-sp-kuma-15-tkm-02-6",
    "bomId": "bom-sp-kuma-15-tkm-02",
    "name": "6: NC 123",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 1500,
    "sortOrder": 6
  },
  {
    "id": "bp-sp-kuma-15-tkm-02-7",
    "bomId": "bom-sp-kuma-15-tkm-02",
    "name": "7. Móc gờ trục",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 3200,
    "sortOrder": 7
  },
  {
    "id": "bp-sp-kuma-15-tkm-03-1",
    "bomId": "bom-sp-kuma-15-tkm-03",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-kuma-15-tkm-03-2",
    "bomId": "bom-sp-kuma-15-tkm-03",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 4000,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-kuma-15-tkm-03-3",
    "bomId": "bom-sp-kuma-15-tkm-03",
    "name": "3: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-kuma-15-tkm-03-4",
    "bomId": "bom-sp-kuma-15-tkm-03",
    "name": "4: Khoan phá",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 2500,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-kuma-15-tkm-03-5",
    "bomId": "bom-sp-kuma-15-tkm-03",
    "name": "5: Sấn rãnh+tiện trơn",
    "productionTeamId": "t_auto",
    "machineGroupId": "mg_auto",
    "quotaPerShift": 1000,
    "sortOrder": 5
  },
  {
    "id": "bp-sp-kuma-15-tkm-03-6",
    "bomId": "bom-sp-kuma-15-tkm-03",
    "name": "6: Ren ống",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 3500,
    "sortOrder": 6
  },
  {
    "id": "bp-sp-kuma-15-tkm-04-1",
    "bomId": "bom-sp-kuma-15-tkm-04",
    "name": "1: Gia công",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 3200,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-kuma-15-tkm-04-2",
    "bomId": "bom-sp-kuma-15-tkm-04",
    "name": "2: Phay giác",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 3400,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-kuma-15-tkm-05-1",
    "bomId": "bom-sp-kuma-15-tkm-05",
    "name": "Lắp ráp",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 800,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-kuma-15-tkm-05-2",
    "bomId": "bom-sp-kuma-15-tkm-05",
    "name": "Bao gói",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 0,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-01-1",
    "bomId": "bom-sp-novo-vg-15-khoa-01",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-01-2",
    "bomId": "bom-sp-novo-vg-15-khoa-01",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 4000,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-01-3",
    "bomId": "bom-sp-novo-vg-15-khoa-01",
    "name": "3: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-01-4",
    "bomId": "bom-sp-novo-vg-15-khoa-01",
    "name": "4: Hoàn thiện",
    "productionTeamId": "t_auto",
    "machineGroupId": "mg_auto",
    "quotaPerShift": 4000,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-02-1",
    "bomId": "bom-sp-novo-vg-15-khoa-02",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-02-2",
    "bomId": "bom-sp-novo-vg-15-khoa-02",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 2500,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-02-3",
    "bomId": "bom-sp-novo-vg-15-khoa-02",
    "name": "3: Dập bavia",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 3500,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-02-4",
    "bomId": "bom-sp-novo-vg-15-khoa-02",
    "name": "4: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-02-5",
    "bomId": "bom-sp-novo-vg-15-khoa-02",
    "name": "5: Khoan phá",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 2500,
    "sortOrder": 5
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-02-6",
    "bomId": "bom-sp-novo-vg-15-khoa-02",
    "name": "6: Gia công 123",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 1000,
    "sortOrder": 6
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-02-7",
    "bomId": "bom-sp-novo-vg-15-khoa-02",
    "name": "7: Sấn rãnh",
    "productionTeamId": "t_auto",
    "machineGroupId": "mg_auto",
    "quotaPerShift": 1100,
    "sortOrder": 7
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-02-8",
    "bomId": "bom-sp-novo-vg-15-khoa-02",
    "name": "8: Móc gờ trục",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 5000,
    "sortOrder": 8
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-02-9",
    "bomId": "bom-sp-novo-vg-15-khoa-02",
    "name": "9: Khoan lỗ kẹp trì",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 6000,
    "sortOrder": 9
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-03-1",
    "bomId": "bom-sp-novo-vg-15-khoa-03",
    "name": "1: Gia công",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 6000,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-03-2",
    "bomId": "bom-sp-novo-vg-15-khoa-03",
    "name": "2: Phay giác",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 6000,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-04-1",
    "bomId": "bom-sp-novo-vg-15-khoa-04",
    "name": "1: Gia công",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 3000,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-05-1",
    "bomId": "bom-sp-novo-vg-15-khoa-05",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-05-2",
    "bomId": "bom-sp-novo-vg-15-khoa-05",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 8000,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-05-3",
    "bomId": "bom-sp-novo-vg-15-khoa-05",
    "name": "3: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-05-4",
    "bomId": "bom-sp-novo-vg-15-khoa-05",
    "name": "4: Gia công ren ống",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 3500,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-05-5",
    "bomId": "bom-sp-novo-vg-15-khoa-05",
    "name": "5: Khoan lỗ kẹp chì",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 3500,
    "sortOrder": 5
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-06-1",
    "bomId": "bom-sp-novo-vg-15-khoa-06",
    "name": "1: Gia công",
    "productionTeamId": "t_auto",
    "machineGroupId": "mg_auto",
    "quotaPerShift": 1200,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-06-2",
    "bomId": "bom-sp-novo-vg-15-khoa-06",
    "name": "2: Khỏa mặt",
    "productionTeamId": "t_auto",
    "machineGroupId": "mg_auto",
    "quotaPerShift": 6500,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-07-1",
    "bomId": "bom-sp-novo-vg-15-khoa-07",
    "name": "1: Gia công",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 1500,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-khoa-07-2",
    "bomId": "bom-sp-novo-vg-15-khoa-07",
    "name": "2: Khoả mặt",
    "productionTeamId": "t_auto",
    "machineGroupId": "mg_auto",
    "quotaPerShift": 3500,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vc-20-01-1",
    "bomId": "bom-sp-novo-vc-20-01",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vc-20-01-2",
    "bomId": "bom-sp-novo-vc-20-01",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 5000,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vc-20-01-3",
    "bomId": "bom-sp-novo-vc-20-01",
    "name": "3: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-novo-vc-20-01-4",
    "bomId": "bom-sp-novo-vc-20-01",
    "name": "4: Hoàn thiện",
    "productionTeamId": "t_auto",
    "machineGroupId": "mg_auto",
    "quotaPerShift": 4000,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-novo-vc-20-02-1",
    "bomId": "bom-sp-novo-vc-20-02",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vc-20-02-2",
    "bomId": "bom-sp-novo-vc-20-02",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 3000,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vc-20-02-3",
    "bomId": "bom-sp-novo-vc-20-02",
    "name": "3: Dập bavia",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 4200,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-novo-vc-20-02-4",
    "bomId": "bom-sp-novo-vc-20-02",
    "name": "4: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-novo-vc-20-02-5",
    "bomId": "bom-sp-novo-vc-20-02",
    "name": "5: Gia công 123",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 1000,
    "sortOrder": 5
  },
  {
    "id": "bp-sp-novo-vc-20-02-6",
    "bomId": "bom-sp-novo-vc-20-02",
    "name": "6: Cắt côn",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 1000,
    "sortOrder": 6
  },
  {
    "id": "bp-sp-novo-vc-20-03-1",
    "bomId": "bom-sp-novo-vc-20-03",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vc-20-03-2",
    "bomId": "bom-sp-novo-vc-20-03",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 3000,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vc-20-03-3",
    "bomId": "bom-sp-novo-vc-20-03",
    "name": "3: Dập via",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 4000,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-novo-vc-20-03-4",
    "bomId": "bom-sp-novo-vc-20-03",
    "name": "4: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-novo-vc-20-03-5",
    "bomId": "bom-sp-novo-vc-20-03",
    "name": "5: Khoan + taro",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 2500,
    "sortOrder": 5
  },
  {
    "id": "bp-sp-novo-vc-20-03-6",
    "bomId": "bom-sp-novo-vc-20-03",
    "name": "6: Cắt côn",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 1000,
    "sortOrder": 6
  },
  {
    "id": "bp-sp-novo-vc-20-04-1",
    "bomId": "bom-sp-novo-vc-20-04",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vc-20-04-2",
    "bomId": "bom-sp-novo-vc-20-04",
    "name": "2: Gia công ren thang",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 2000,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vc-20-04-3",
    "bomId": "bom-sp-novo-vc-20-04",
    "name": "3: Gia công ren met",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 2000,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-novo-vc-20-04-4",
    "bomId": "bom-sp-novo-vc-20-04",
    "name": "4: Phay giác",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 3000,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-novo-vc-20-05-1",
    "bomId": "bom-sp-novo-vc-20-05",
    "name": "1: Gia công hoàn chỉnh",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 2000,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vc-20-06-1",
    "bomId": "bom-sp-novo-vc-20-06",
    "name": "1: Gia công ren lắp ráp",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 2500,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vc-20-06-2",
    "bomId": "bom-sp-novo-vc-20-06",
    "name": "2: Phay rãnh",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 5000,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vc-20-07-1",
    "bomId": "bom-sp-novo-vc-20-07",
    "name": "1: Hoàn thiện",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 5000,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-lh-01-1",
    "bomId": "bom-sp-novo-vg-15-lh-01",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-lh-01-2",
    "bomId": "bom-sp-novo-vg-15-lh-01",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 4000,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-lh-01-3",
    "bomId": "bom-sp-novo-vg-15-lh-01",
    "name": "3: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-novo-vg-15-lh-01-4",
    "bomId": "bom-sp-novo-vg-15-lh-01",
    "name": "4: Hoàn thiện",
    "productionTeamId": "t_auto",
    "machineGroupId": "mg_auto",
    "quotaPerShift": 5000,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-novo-vg-15-lh-02-1",
    "bomId": "bom-sp-novo-vg-15-lh-02",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-lh-02-2",
    "bomId": "bom-sp-novo-vg-15-lh-02",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 599,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-lh-02-3",
    "bomId": "bom-sp-novo-vg-15-lh-02",
    "name": "3: Dập bavia",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 3400,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-novo-vg-15-lh-02-4",
    "bomId": "bom-sp-novo-vg-15-lh-02",
    "name": "4: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-novo-vg-15-lh-02-5",
    "bomId": "bom-sp-novo-vg-15-lh-02",
    "name": "5: Khoan phá",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 3000,
    "sortOrder": 5
  },
  {
    "id": "bp-sp-novo-vg-15-lh-02-6",
    "bomId": "bom-sp-novo-vg-15-lh-02",
    "name": "6: Gia công 123",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 1200,
    "sortOrder": 6
  },
  {
    "id": "bp-sp-novo-vg-15-lh-02-7",
    "bomId": "bom-sp-novo-vg-15-lh-02",
    "name": "7: Móc gờ trục",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 8000,
    "sortOrder": 7
  },
  {
    "id": "bp-sp-novo-vg-15-lh-02-8",
    "bomId": "bom-sp-novo-vg-15-lh-02",
    "name": "8: Khoan lỗ kẹp trì",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 5000,
    "sortOrder": 8
  },
  {
    "id": "bp-sp-novo-vg-15-lh-03-1",
    "bomId": "bom-sp-novo-vg-15-lh-03",
    "name": "1: Gia công",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 1200,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-lh-03-2",
    "bomId": "bom-sp-novo-vg-15-lh-03",
    "name": "2: Phay giác",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 3100,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-lh-04-1",
    "bomId": "bom-sp-novo-vg-15-lh-04",
    "name": "1: Gia công",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 7000,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-lh-05-1",
    "bomId": "bom-sp-novo-vg-15-lh-05",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-lh-05-2",
    "bomId": "bom-sp-novo-vg-15-lh-05",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 6636,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-lh-05-3",
    "bomId": "bom-sp-novo-vg-15-lh-05",
    "name": "3: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-novo-vg-15-lh-05-4",
    "bomId": "bom-sp-novo-vg-15-lh-05",
    "name": "4: Gia công ren ống",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 5525,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-novo-vg-15-lh-05-5",
    "bomId": "bom-sp-novo-vg-15-lh-05",
    "name": "5: Khoan lỗ kẹp chì",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 4000,
    "sortOrder": 5
  },
  {
    "id": "bp-sp-novo-vg-15-lh-06-1",
    "bomId": "bom-sp-novo-vg-15-lh-06",
    "name": "1: Cắt Phôi",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-lh-06-2",
    "bomId": "bom-sp-novo-vg-15-lh-06",
    "name": "2: Dập nóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 4000,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-lh-06-3",
    "bomId": "bom-sp-novo-vg-15-lh-06",
    "name": "3: Đánh bóng",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 0,
    "sortOrder": 3
  },
  {
    "id": "bp-sp-novo-vg-15-lh-06-4",
    "bomId": "bom-sp-novo-vg-15-lh-06",
    "name": "4: Gia công ren ống",
    "productionTeamId": "t_hot",
    "machineGroupId": "mg_hot",
    "quotaPerShift": 3500,
    "sortOrder": 4
  },
  {
    "id": "bp-sp-novo-vg-15-lh-06-5",
    "bomId": "bom-sp-novo-vg-15-lh-06",
    "name": "5: Khoan lỗ kẹp chì",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 3500,
    "sortOrder": 5
  },
  {
    "id": "bp-sp-novo-vg-15-lh-07-1",
    "bomId": "bom-sp-novo-vg-15-lh-07",
    "name": "1: Gia công",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 1500,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-lh-07-2",
    "bomId": "bom-sp-novo-vg-15-lh-07",
    "name": "2: Khoả mặt",
    "productionTeamId": "t_auto",
    "machineGroupId": "mg_auto",
    "quotaPerShift": 3000,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-lh-08-1",
    "bomId": "bom-sp-novo-vg-15-lh-08",
    "name": "1: Gia công",
    "productionTeamId": "t_auto",
    "machineGroupId": "mg_auto",
    "quotaPerShift": 1500,
    "sortOrder": 1
  },
  {
    "id": "bp-sp-novo-vg-15-lh-08-2",
    "bomId": "bom-sp-novo-vg-15-lh-08",
    "name": "2: Khỏa mặt",
    "productionTeamId": "t_auto",
    "machineGroupId": "mg_auto",
    "quotaPerShift": 2400,
    "sortOrder": 2
  },
  {
    "id": "bp-sp-novo-vg-15-lh-09-1",
    "bomId": "bom-sp-novo-vg-15-lh-09",
    "name": "1: Gia công hoàn thiện",
    "productionTeamId": "t_asm",
    "machineGroupId": "mg_asm",
    "quotaPerShift": 8000,
    "sortOrder": 1
  }
];

export const DMKT_MACHINES: Machine[] = [
  {
    "id": "m-cam",
    "name": "CAM",
    "accountingCode": "CAM",
    "code": "CAM",
    "machineGroupId": "mg_asm",
    "productionTeamId": "t_asm",
    "teamId": "t_asm",
    "specs": {},
    "active": true
  },
  {
    "id": "m-cnc",
    "name": "CNC",
    "accountingCode": "CNC",
    "code": "CNC",
    "machineGroupId": "mg_auto",
    "productionTeamId": "t_auto",
    "teamId": "t_auto",
    "specs": {},
    "active": true
  },
  {
    "id": "m-cp",
    "name": "CP",
    "accountingCode": "CP",
    "code": "CP",
    "machineGroupId": "mg_hot",
    "productionTeamId": "t_hot",
    "teamId": "t_hot",
    "specs": {},
    "active": true
  },
  {
    "id": "m-d80t-01",
    "name": "D80T-01",
    "accountingCode": "D80T-01",
    "code": "D80T-01",
    "machineGroupId": "mg_hot",
    "productionTeamId": "t_hot",
    "teamId": "t_hot",
    "specs": {},
    "active": true
  },
  {
    "id": "m-d80t-02",
    "name": "D80T-02",
    "accountingCode": "D80T-02",
    "code": "D80T-02",
    "machineGroupId": "mg_hot",
    "productionTeamId": "t_hot",
    "teamId": "t_hot",
    "specs": {},
    "active": true
  },
  {
    "id": "m-dbv",
    "name": "DBV",
    "accountingCode": "DBV",
    "code": "DBV",
    "machineGroupId": "mg_hot",
    "productionTeamId": "t_hot",
    "teamId": "t_hot",
    "specs": {},
    "active": true
  },
  {
    "id": "m-dt",
    "name": "DTĐ",
    "accountingCode": "DT",
    "code": "DT",
    "machineGroupId": "mg_hot",
    "productionTeamId": "t_hot",
    "teamId": "t_hot",
    "specs": {},
    "active": true
  },
  {
    "id": "m-dt-80t-01",
    "name": "DTĐ-80T-01",
    "accountingCode": "DT-80T-01",
    "code": "DT-80T-01",
    "machineGroupId": "mg_hot",
    "productionTeamId": "t_hot",
    "teamId": "t_hot",
    "specs": {},
    "active": true
  },
  {
    "id": "m-khoan-tay",
    "name": "Khoan tay",
    "accountingCode": "KHOAN-TAY",
    "code": "KHOAN-TAY",
    "machineGroupId": "mg_asm",
    "productionTeamId": "t_asm",
    "teamId": "t_asm",
    "specs": {},
    "active": true
  },
  {
    "id": "m-k",
    "name": "KĐ",
    "accountingCode": "K",
    "code": "K",
    "machineGroupId": "mg_hot",
    "productionTeamId": "t_hot",
    "teamId": "t_hot",
    "specs": {},
    "active": true
  },
  {
    "id": "m-mgt",
    "name": "MGT",
    "accountingCode": "MGT",
    "code": "MGT",
    "machineGroupId": "mg_hot",
    "productionTeamId": "t_hot",
    "teamId": "t_hot",
    "specs": {},
    "active": true
  },
  {
    "id": "m-po",
    "name": "POĐ",
    "accountingCode": "PO",
    "code": "PO",
    "machineGroupId": "mg_asm",
    "productionTeamId": "t_asm",
    "teamId": "t_asm",
    "specs": {},
    "active": true
  },
  {
    "id": "m-phay-truc",
    "name": "Phay trục",
    "accountingCode": "PHAY-TRUC",
    "code": "PHAY-TRUC",
    "machineGroupId": "mg_asm",
    "productionTeamId": "t_asm",
    "teamId": "t_asm",
    "specs": {},
    "active": true
  },
  {
    "id": "m-tn",
    "name": "TN",
    "accountingCode": "TN",
    "code": "TN",
    "machineGroupId": "mg_hot",
    "productionTeamId": "t_hot",
    "teamId": "t_hot",
    "specs": {},
    "active": true
  },
  {
    "id": "m-tn-tq",
    "name": "TN-TQ",
    "accountingCode": "TN-TQ",
    "code": "TN-TQ",
    "machineGroupId": "mg_auto",
    "productionTeamId": "t_auto",
    "teamId": "t_auto",
    "specs": {},
    "active": true
  },
  {
    "id": "m-tt",
    "name": "TT",
    "accountingCode": "TT",
    "code": "TT",
    "machineGroupId": "mg_hot",
    "productionTeamId": "t_hot",
    "teamId": "t_hot",
    "specs": {},
    "active": true
  },
  {
    "id": "m-ttr",
    "name": "TTr",
    "accountingCode": "TTR",
    "code": "TTR",
    "machineGroupId": "mg_asm",
    "productionTeamId": "t_asm",
    "teamId": "t_asm",
    "specs": {},
    "active": true
  },
  {
    "id": "m-tv01",
    "name": "TV01",
    "accountingCode": "TV01",
    "code": "TV01",
    "machineGroupId": "mg_hot",
    "productionTeamId": "t_hot",
    "teamId": "t_hot",
    "specs": {},
    "active": true
  },
  {
    "id": "m-con-l",
    "name": "côn ĐL (*)",
    "accountingCode": "CON-L",
    "code": "CON-L",
    "machineGroupId": "mg_hot",
    "productionTeamId": "t_hot",
    "teamId": "t_hot",
    "specs": {},
    "active": true
  },
  {
    "id": "m-b",
    "name": "ĐB",
    "accountingCode": "B",
    "code": "B",
    "machineGroupId": "mg_hot",
    "productionTeamId": "t_hot",
    "teamId": "t_hot",
    "specs": {},
    "active": true
  }
];

export const DMKT_WAREHOUSE: WarehouseStock[] = [
  {
    "id": "ws-p1",
    "warehouseId": "wh-main",
    "itemKind": "product",
    "itemId": "p1",
    "qty": 15
  },
  {
    "id": "ws-sp-novo-vg-15-01",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-01",
    "qty": 47
  },
  {
    "id": "ws-sp-novo-vg-15-02",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-02",
    "qty": 54
  },
  {
    "id": "ws-sp-novo-vg-15-03",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-03",
    "qty": 61
  },
  {
    "id": "ws-sp-novo-vg-15-04",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-04",
    "qty": 68
  },
  {
    "id": "ws-sp-novo-vg-15-05",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-05",
    "qty": 75
  },
  {
    "id": "ws-sp-novo-vg-15-06",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-06",
    "qty": 82
  },
  {
    "id": "ws-sp-novo-vg-15-07",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-07",
    "qty": 89
  },
  {
    "id": "ws-p3",
    "warehouseId": "wh-main",
    "itemKind": "product",
    "itemId": "p3",
    "qty": 15
  },
  {
    "id": "ws-sp-novo-vb-15-abs-01",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vb-15-abs-01",
    "qty": 47
  },
  {
    "id": "ws-sp-novo-vb-15-abs-02",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vb-15-abs-02",
    "qty": 54
  },
  {
    "id": "ws-sp-novo-vb-15-abs-03",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vb-15-abs-03",
    "qty": 61
  },
  {
    "id": "ws-sp-novo-vb-15-abs-04",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vb-15-abs-04",
    "qty": 68
  },
  {
    "id": "ws-sp-novo-vb-15-abs-05",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vb-15-abs-05",
    "qty": 75
  },
  {
    "id": "ws-p4",
    "warehouseId": "wh-main",
    "itemKind": "product",
    "itemId": "p4",
    "qty": 15
  },
  {
    "id": "ws-sp-kuma-15-tkm-01",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-kuma-15-tkm-01",
    "qty": 47
  },
  {
    "id": "ws-sp-kuma-15-tkm-02",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-kuma-15-tkm-02",
    "qty": 54
  },
  {
    "id": "ws-sp-kuma-15-tkm-03",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-kuma-15-tkm-03",
    "qty": 61
  },
  {
    "id": "ws-sp-kuma-15-tkm-04",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-kuma-15-tkm-04",
    "qty": 68
  },
  {
    "id": "ws-sp-kuma-15-tkm-05",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-kuma-15-tkm-05",
    "qty": 75
  },
  {
    "id": "ws-p5",
    "warehouseId": "wh-main",
    "itemKind": "product",
    "itemId": "p5",
    "qty": 15
  },
  {
    "id": "ws-sp-novo-vg-15-khoa-01",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-khoa-01",
    "qty": 47
  },
  {
    "id": "ws-sp-novo-vg-15-khoa-02",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-khoa-02",
    "qty": 54
  },
  {
    "id": "ws-sp-novo-vg-15-khoa-03",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-khoa-03",
    "qty": 61
  },
  {
    "id": "ws-sp-novo-vg-15-khoa-04",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-khoa-04",
    "qty": 68
  },
  {
    "id": "ws-sp-novo-vg-15-khoa-05",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-khoa-05",
    "qty": 75
  },
  {
    "id": "ws-sp-novo-vg-15-khoa-06",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-khoa-06",
    "qty": 82
  },
  {
    "id": "ws-sp-novo-vg-15-khoa-07",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-khoa-07",
    "qty": 89
  },
  {
    "id": "ws-p2",
    "warehouseId": "wh-main",
    "itemKind": "product",
    "itemId": "p2",
    "qty": 15
  },
  {
    "id": "ws-sp-novo-vc-20-01",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vc-20-01",
    "qty": 47
  },
  {
    "id": "ws-sp-novo-vc-20-02",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vc-20-02",
    "qty": 54
  },
  {
    "id": "ws-sp-novo-vc-20-03",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vc-20-03",
    "qty": 61
  },
  {
    "id": "ws-sp-novo-vc-20-04",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vc-20-04",
    "qty": 68
  },
  {
    "id": "ws-sp-novo-vc-20-05",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vc-20-05",
    "qty": 75
  },
  {
    "id": "ws-sp-novo-vc-20-06",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vc-20-06",
    "qty": 82
  },
  {
    "id": "ws-sp-novo-vc-20-07",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vc-20-07",
    "qty": 89
  },
  {
    "id": "ws-p6",
    "warehouseId": "wh-main",
    "itemKind": "product",
    "itemId": "p6",
    "qty": 15
  },
  {
    "id": "ws-sp-novo-vg-15-lh-01",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-lh-01",
    "qty": 47
  },
  {
    "id": "ws-sp-novo-vg-15-lh-02",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-lh-02",
    "qty": 54
  },
  {
    "id": "ws-sp-novo-vg-15-lh-03",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-lh-03",
    "qty": 61
  },
  {
    "id": "ws-sp-novo-vg-15-lh-04",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-lh-04",
    "qty": 68
  },
  {
    "id": "ws-sp-novo-vg-15-lh-05",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-lh-05",
    "qty": 75
  },
  {
    "id": "ws-sp-novo-vg-15-lh-06",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-lh-06",
    "qty": 82
  },
  {
    "id": "ws-sp-novo-vg-15-lh-07",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-lh-07",
    "qty": 89
  },
  {
    "id": "ws-sp-novo-vg-15-lh-08",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-lh-08",
    "qty": 96
  },
  {
    "id": "ws-sp-novo-vg-15-lh-09",
    "warehouseId": "wh-main",
    "itemKind": "semi_product",
    "itemId": "sp-novo-vg-15-lh-09",
    "qty": 103
  }
];
