import type { IWorkbookData } from '@univerjs/core'

export const WORKBOOK_DATA: Partial<IWorkbookData> ={
  "id": "workbook-01",
  "sheetOrder": [
    "sheet-01"
  ],
  "name": "My Workbook",
  "appVersion": "0.10.12",
  "styles": {},
  "sheets": {
    "sheet-01": {
      "id": "sheet-01",
      "name": "Sheet1",
      "cellData": {
        "0": {
          "0": {
            "v": "Name",
            "t": 1
          },
          "1": {
            "v": "Age",
            "t": 1
          },
          "2": {
            "v": "City",
            "t": 1
          }
        },
        "1": {
          "0": {
            "v": "Alice",
            "t": 1
          },
          "1": {
            "v": 25,
            "t": 2
          },
          "2": {
            "v": "Beijing",
            "t": 1
          }
        },
        "2": {
          "0": {
            "v": "Bob",
            "t": 1
          },
          "1": {
            "v": 30,
            "t": 2
          },
          "2": {
            "v": "Shanghai",
            "t": 1
          }
        }
      },
      "tabColor": "",
      "hidden": 0,
      "rowCount": 1000,
      "columnCount": 20,
      "zoomRatio": 1,
      "freeze": {
        "xSplit": 0,
        "ySplit": 0,
        "startRow": -1,
        "startColumn": -1
      },
      "scrollTop": 0,
      "scrollLeft": 0,
      "defaultColumnWidth": 88,
      "defaultRowHeight": 24,
      "mergeData": [],
      "rowData": {},
      "columnData": {
        "0": {
          "w": 2070.84375
        }
      },
      "showGridlines": 1,
      "rowHeader": {
        "width": 46,
        "hidden": 0
      },
      "columnHeader": {
        "height": 20,
        "hidden": 0
      },
      "rightToLeft": 0
    }
  },
  "resources": []
}