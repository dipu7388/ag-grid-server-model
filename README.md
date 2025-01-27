# Implementing `rowModelType='serverSide'` in AG Grid with Tree Data

## Benefits of Using Server-Side Row Model
1. **Efficient Data Handling**: Handles large datasets by fetching data on-demand, reducing memory usage.
2. **Scalability**: Suitable for applications with hierarchical or paginated data.
3. **Customizability**: Offers extensive options for pagination, grouping, sorting, and filtering.
4. **Tree Data Support**: Enables dynamic tree data loading with parent-child relationships.

## Setup Instructions

### Clone the Repository
1. Clone the repository to get a working example:
   ```bash
   git clone https://github.com/dipu7388/ag-grid-server-model.git
   ```
2. Navigate to the project folder:
   ```bash
   cd ag-grid-server-model
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm start
   ```
   The application will be hosted locally.

## Implementing Server-Side Row Model with Tree Data

Below is the configuration for implementing `rowModelType='serverSide'` with tree data:

```html
<ag-grid-angular
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
/>
```

### Key Properties
- **`[rowModelType]='serverSide'`**: Enables server-side row model.
- **`[treeData]='true'`**: Configures the grid to use tree data.
- **`[serverSideDatasource]='serverSideModel'`**: Provides the server-side data source.
- **Pagination**: Enabled with customizable page size and caching options.

### Handling Tree Data Expansion
To prevent API calls on child node expansion when data is already loaded:
```typescript
params.api!.applyServerSideRowData({
    route,
    successParams: {
        rowData: childData,
        rowCount: childData.length,
    },
});
```

## Challenges Faced

### 1. Checkbox Disabled State
**Issue**: When a parent row is selected, child rows should be disabled. However, the checkbox state updates only for rows in the viewport.

**Row Selection Config**:
checkbox disable logic:
```typescript
public rowSelection: RowSelectionOptions | "single" | "multiple" = {
    mode: "multiRow",
    headerCheckbox: true,
    groupSelects: 'descendants',
    checkboxLocation: 'autoGroupColumn',
    hideDisabledCheckboxes: false,
    checkboxes: (params: CheckboxSelectionCallbackParams): boolean => {
        if (params.node.parent?.isSelected()) {
            return false;
        }
        return true;
    },
    selectAll: 'currentPage', // Ignored for server-side
};
```

### 2. Select All Behavior
**Issue**: `groupSelects: 'descendants'` causes `selectAll` to select all pages records (eg user fetched data i.e if page 1 select all gives 10, then visit page 2 selects all give 20, assuming page size is 10 only) instead of current page items.


### 3. Fetch-Free Child Expansion
**Issue**: Expanding a child node fetches data unnecessarily.


### 4. Drag-and-Drop Challenges
**Issue**: Drag-and-drop operations can be tricky with server-side models.


## References
- [Server-Side Model Selection](https://www.ag-grid.com/angular-data-grid/server-side-model-selection/)
- [Server-Side Model Configuration](https://www.ag-grid.com/angular-data-grid/server-side-model-configuration/#server-side-cache)
- [Server-Side Model Datasource](https://www.ag-grid.com/angular-data-grid/server-side-model-datasource/)
- [Row Dragging and Tree Data](https://www.ag-grid.com/angular-data-grid/row-dragging/#row-dragging--tree-data)
