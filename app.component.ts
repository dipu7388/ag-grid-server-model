import {
  AllCommunityModule,
  CheckboxSelectionCallbackParams,
  ClientSideRowModelApiModule,
  ClientSideRowModelModule,
  ColDef,
  ColGroupDef,
  GetDataPath,
  GetRowIdFunc,
  GridApi,
  GridOptions,
  GridReadyEvent,
  IServerSideDatasource,
  IServerSideGetRowsParams,
  IsServerSideGroupOpenByDefaultParams,
  ModuleRegistry,
  PaginationModule,
  RowApiModule,
  RowSelectionOptions,
  SelectAllMode,
  SelectionChangedEvent,
  SelectionColumnDef,
  SelectionEventSourceType,
  ValidationModule,
  createGrid,
} from "ag-grid-community";
import {
  AllEnterpriseModule,
  ServerSideRowModelApiModule,
  ServerSideRowModelModule,
  TreeDataModule,
} from "ag-grid-enterprise";

import { AgGridAngular } from "ag-grid-angular";
import { Component } from "@angular/core";
import { getData } from "./data";

ModuleRegistry.registerModules([
  AllCommunityModule,
  AllEnterpriseModule,
  RowApiModule,
  ServerSideRowModelApiModule,
  ServerSideRowModelModule,
  ClientSideRowModelApiModule,
  ClientSideRowModelModule,
  TreeDataModule,
  PaginationModule,
  ValidationModule /* Development Only */,
]);

interface DataItem {
  id: string;
  data_path: string[];
  name: string;
}

interface HierarchyNode extends DataItem {
  children?: HierarchyNode[];
  haveChildren?: boolean;
}

function buildHierarchy(data: DataItem[]): HierarchyNode[] {
  // Create a map to store items by their id for quick access
  const idToNodeMap = new Map<string, HierarchyNode>();

  // Initialize hierarchy array to store root nodes
  const hierarchy: HierarchyNode[] = [];

  // Populate the idToNodeMap and initialize children arrays
  for (const item of data) {
    idToNodeMap.set(item.id, { ...item, children: [] });
  }

  // Build the hierarchy by iterating through each item
  for (const item of data) {
    const currentNode = idToNodeMap.get(item.id)!;

    // If the data_path length is 1, it's a root node
    if (item.data_path.length === 1) {
      hierarchy.push(currentNode);
    } else {
      // Find the parent node and add the current node to its children
      const parentId = item.data_path[item.data_path.length - 2];
      const parentNode = idToNodeMap.get(parentId);
      if (parentNode) {
        parentNode.children!.push(currentNode);
        parentNode.haveChildren = !!parentNode.children?.length;
      }
    }
  }

  return hierarchy;
}

@Component({
  selector: "my-app",
  standalone: true,
  imports: [AgGridAngular],
  template: `<ag-grid-angular
    style="width: 100%; height: 100%;"
    [columnDefs]="columnDefs"
    [defaultColDef]="defaultColDef"
    [autoGroupColumnDef]="autoGroupColumnDef"
    [suppressGroupRowsSticky]="true"
    [rowData]="rowData"
    [treeData]="true"
    [groupDefaultExpanded]="groupDefaultExpanded"
    [getDataPath]="getDataPath"
    [rowModelType]="'serverSide'"
    [serverSideDatasource]="serverSideModel"
    [cacheBlockSize]="5"
    [isServerSideGroup]="isServerSideGroup"
    [getServerSideGroupKey]="getServerSideGroupKey"
    [pagination]="true"
    [debug]="true"
    [paginationPageSize]="5"
    [maxBlocksInCache]="5"
    [paginationPageSizeSelector]="[5, 10, 25, 50, 100]"
    [isServerSideGroupOpenByDefault]="isServerSideGroupOpenByDefault"
    [rowSelection]="rowSelection"
     [getRowId]="getRowId"
     [selectionColumnDef]="selectionColumnDef"
     (selectionChanged)="onSelectionChanged($event)"
     [rowClassRules]="rowClassRules"
  /> `,
})
export class AppComponent {

  selectAll = (
    mode?: SelectAllMode,
    source?: SelectionEventSourceType
) => console.log(mode, source);
  rowClassRules=  {
    'ag-row-selected' : (params) =>  {
        return params.node.selected === true
    },
}

  onSelectionChanged(evt: SelectionChangedEvent): void {
    evt.api.setNodesSelected({
      nodes: evt.api.getSelectedRows(),
      newValue: true
    })
    console.log('Selected Nodes', evt.api.getSelectedRows());
    // evt.api.refreshCells({
    //   columns: ['name']
    // })
}
  selectionColumnDef: SelectionColumnDef= {
    onCellValueChanged: (evt)=> console.log(evt),
    
 
  }
  public getRowId: GetRowIdFunc = (params) => `${params.data.id}`;
  public columnDefs: ColDef[] = [
    { field: "id" },
    {
      field: "data_path",
      aggFunc: "data_path",
      valueFormatter: (params) => {
        return params.value?.join("/");
      },
    },
    {
      field: "haveChildren",
    },
  ];
  public defaultColDef: ColDef = {
    flex: 1,
  };

  public rowSelection: RowSelectionOptions | "single" | "multiple" = {
    mode: "multiRow",
    headerCheckbox : true,
    groupSelects: 'descendants',
    checkboxLocation: 'autoGroupColumn',
    hideDisabledCheckboxes: false,
    checkboxes: (params: CheckboxSelectionCallbackParams):boolean => {
      console.log(params.node.parent);
      if(params.node.parent?.isSelected()){
        return false;
      }
      return true;
    },
    selectAll: 'currentPage', // ignored for server side
  };
  public autoGroupColumnDef: ColDef = {
    headerName: "Assets Name",
    field: "name",
    minWidth: 280,
    rowGroup: true,
    cellRendererParams: {
      suppressCount: true,
    },
    rowDrag: true
  };
  public rowData: any[] | null = getData();
  public groupDefaultExpanded = -1;
  public getDataPath: GetDataPath = (data) => data.path;
  isServerSideGroup = (dataItem) => {
    return dataItem.haveChildren ?? false;
  };

  // specify which group key to use
  getServerSideGroupKey = (dataItem) => {
    return dataItem.id;
  };

  isServerSideGroupOpenByDefault: (
    params: IsServerSideGroupOpenByDefaultParams
  ) => boolean = (params: IsServerSideGroupOpenByDefaultParams) => {
    // open first two levels by default
    return params.rowNode.level >= 0;
  };
  serverSideModel:IServerSideDatasource = {
    // getRows: (params: IServerSideGetRowsParams) => {
    //     console.log(params.request);
    //         if(params.request.groupKeys.length === 0){
    //         const data =   buildHierarchy(getData());
    //           params.success({
    //             rowData: data.slice(params.request.startRow, params.request.endRow),
    //             rowCount: data.length,
    //           });
    //         }else{
    //           // params.api.applyServerSideRowData()
    //           console.log(params.request.groupKeys, params);
    //           params.success({
    //             rowData: params.parentNode.data.children,
    //             rowCount: params.parentNode.data.children.length,
    //           });
    //         }
    // },
    
    getRows: (params: IServerSideGetRowsParams) => {
      const request = params.request;
      if (request.groupKeys.length) {
        params.fail();
        return;
      }
      const topLevelData = buildHierarchy(getData());
      // Provide rows to AG Grid for the root level
      const result = {
        rowData: topLevelData.slice(request.startRow, request.endRow),
        rowCount: topLevelData.length,
      };
      params.success(result);
      // Recursively populate hierarchy for the provided data
      const recursivelyPopulateHierarchy = (route: string[], node: any) => {
        // Get all direct children of the current node
        const childData = node.children;

        if (childData.length) {
          // Apply child data to AG Grid dynamically
          params.api!.applyServerSideRowData({
            route,
            successParams: {
              rowData: childData,
              rowCount: childData.length,
            },
          });

          // Recursively process each child
          childData.forEach((child) => {
            recursivelyPopulateHierarchy([...route, child.id], child);
          });
        }
        delete node.children;
      };

      // Populate hierarchy starting from top-level nodes
      result.rowData.forEach((topLevelNode) => {
        recursivelyPopulateHierarchy([topLevelNode.id], topLevelNode);
      });
    },
  };
}
