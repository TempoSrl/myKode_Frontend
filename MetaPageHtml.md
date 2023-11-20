[![it](https://img.shields.io/badge/lang-it-green.svg)](https://github.com/TempoSrl/myKode_Frontend/blob/master/MetaPageHtml.it.md)

# HTML of a Page

To ensure proper handling of a web page in the myKode frontend, it is necessary for HTML controls related to data to be displayed or modified (the latter option only for tables of entities or sub-entities in a 1-to-1 relationship with the main entity) to be accompanied by specific attributes.

Additionally, some rules apply to the disabling of fields:
- If myKode finds a control in a disabled state (`Enabled=false` or `ReadOnly=true`), it leaves it in that state. However, it sets its value regardless of the state. Therefore, make sure, if you leave a field disabled, to set default values for that field, as the user won't be able to modify it.
- If a field in the main table is part of the primary key or is auto-incremented, and the form is in "edit" mode, that field will be disabled. In other words, you cannot change the primary key of a row after creating it.
- If a field is not associated with the main table, it will generally be disabled during modification/insertion unless it is explicitly set as a "search" field different from the "standard" field, including the [? …] part of the Tag and has a data-attribute `data-subentity="true"`. Almost all controls have a Tag of the form StandardTag:SearchTag.

The StandardTag is used when the control needs to be read from the Form into the DataSet or taken from the DataSet to fill the form. The SearchTag is used to build the filter to display the list that appears when you click 'perform search'.

The framework automatically handles the binding of the control with the underlying data hosted on the associated MetaPage, through the use of `data-*` attributes.

Below is the list of HTML5 controls managed by the framework and the format of the configuration tag they support:

## INPUT

All INPUT fields excluding LABEL and BUTTON have an attribute named `data-tag` with the structure:

```plaintext
standard tag[?search tag]
```

The standard tag is used for reading and writing in the control, while the search tag is used to extract the search condition. Both have the same internal structure. The search tag is used only in specific cases where the search is performed on a field whose name differs from that in the standard tag.

Note that if it is not the main table, the field is disabled during edit/insertion, while in search mode, it is always enabled.

The only way to make it editable is to:
1. Insert `data-subentity` and specify a "searchTag.SearchField." The `SearchField` should be present on the search view of the page. (For this reason, the tag "?x" will be automatically inserted on AutoChoose fields after the standard tag).
2. Insert `data-subentity` and make sure that the field is a child of the main row.

If the MetaPage finds that a control is disabled (`Enabled=false` or `ReadOnly=true`), it leaves it in that state. However, it sets its value regardless of the state. Therefore, make sure, if you leave a field disabled, to set default values for that field, as the user won't be able to modify it.

### type TEXT and TEXT AREA

Both tags, if present, have the form: `table.field[.format]`

- `table` is the name of the table to which the field refers.
- `field` is the name of the field displayed in the control.
- `format` is a string that modifies the way data is displayed.

If the data is numeric and the format starts with **fixed**, it will have the structure:

```plaintext
fixed.decimal_digits.prefix.suffix.scale
```

where:

- `decimal_digits` is the number of decimal digits to display.
- `prefix` is an optional string to prepend to the number when displaying.
- `suffix` is an optional string to append to the number when displaying (e.g., a percentage symbol `%`).
- `scale` is a scaling factor to use for display. For example, if the number is a percentage stored as a value between 0 and 1, but you want to display it as a number between 0 and 100, `scale` should be 100.

This format is important for displaying numbers with fixed, scaled, or prefixed/suffixed digits. Such modifications are applied transparently when reading or writing the data in the relevant box.

Other values the format can take are:

For numeric fields:

- `n`: Number
- `c`: Currency, and in this case, it will be formatted with the euro symbol.
- `d`: Integer
- `e`, `f`: Float
- `g`: General
- `x`: Hexadecimal

For dates:

- `g`: It is the default format, putting it in the format `dd/mm/yyyy hh:mm`.
- `d`: Format `dd/mm/yyyy`. It is also the default for values in columns of type "DateTime," i.e., if we do not specify any format.
- `dd`: Format `yyyy-MM-dd`




### type CHECKBOX

The `data-tag` of the CHECKBOX control can take two forms:

- `table.field:YesValue:NoValue` if you want the field to take `YesValue` or `NoValue` depending on whether the checkbox is checked or not.
- `table.field:nBit` if `nBit` is the bit number to set in the specified field when the checkbox is selected, and it will be cleared otherwise.
- `table.field:#nBit` if `nBit` is the bit number to set in the specified field when the checkbox is deselected, and it will be cleared otherwise (works in logic negation compared to the previous case).

In a special case, if the control has the `indeterminate` attribute set, it takes an undetermined value that is neither true nor false, representing a null value.

If we want the checkBox to handle threestate, the dataset columns must have the following properties configured:
- `isDenyNull = false`
- `allowDbNull = true`

In this case, the framework automatically adds this information to the HTML control through the data-attribute:
`data-threestate="true"`.

### type RADIO

The `data-tag` of the RADIO control can take three forms:

- `table.field:YesValue` and the field will be set to `YesValue` where the corresponding RADIO is selected.
- `table.field::nBit` if `nBit` is the bit number to set in the field where the radiobutton is selected.
- `table.field::#nBit` if `nBit` is the bit number to reset in the field where the radiobutton is selected.

Nothing happens if the radio is not selected.

### Label

The `data-tag` has the following format:

```plaintext
Table.Field
```

where:
- `Table`: Table from which the data to be displayed must be taken.
- `Field`: Name of the field to be displayed.

Example:
```html
<label data-tag="registry.annotation"></label>
```

## DIV and SPAN with data-value-signed Attribute

In this case, the DIV or SPAN must contain three components: one input text and two input radios:

- The input TEXT is the first text found in the DIV/SPAN (there should be only one).
- The input RADIO "positive sign +" is the first radio found that does not have the `data-tag` set to "-".
- The input RADIO "negative sign -" is the first radio found that has the `data-tag` set to "-".

A DIV or SPAN of this kind is interpreted by the framework as follows: the input TEXT is used to contain a numeric value, which is understood to have a positive sign if the positive sign radio is selected; otherwise, it will have a negative sign.

The DIV or SPAN itself must have a `data-tag` in the form `table.field` (similar to other INPUTs). Therefore, during display, the TEXT will contain the absolute value of the number, while the radio buttons will be selected or deselected based on the sign of the represented value.

Example:

```html
<div data-tag="table.numericColumn" data-value-signed>
    amount: <input type="text" data-tag="t.ctemp">
    <input type="radio" name="op" value="add" data-tag="+"> Add
    <input type="radio" name="op" value="sub" data-tag="-"> Sub
</div>
```


## Button

It is possible to associate buttons with tags containing various commands, some of which are often present on the toolbar.

A general convention is that if a filter needs to be applied to a control, it is set in the `data-filter` attribute, 
programmatically in the MetaPage, with code similar to:

In HTML:

```HTML
<button type="button" id="btn_tratta_spese" class="btn btn-primary mb-2" data-tag="choose.chargehandling.default">Tratt. Spese</button>
```

In MetaPage:

```JS
afterLink: function() {
    var filterTrattaSpese = this.q.ne("active", 'N');
    this.registerFilter($("#btn_do_expense"), filterTrattaSpese);
}
```

In this case, the button `btn_do_expense` is associated with a filter on the `active` field.

There are several standard functions that can be associated with a button, but additional ones can be added by 
overloading the `doMainCommand(tag, filter)` method of the MetaPage.

Let's look at the standard functions that can be associated with a button through the `data-tag`.

### choose

This control is used to activate the display of a list on a specific table or view.
The tag has the form:

```plaintext
choose.tableName.listType[.clear]
```

The `tableName-listType` pair, as we have seen, identifies a way of displaying a list on the `tableName` table.

If the `.clear` part is present, the effect is the same as selecting "no row" on the indicated table, with the consequent emptying of any controls related to it.

Once the list appears, the user has the option to select a row or exit without selecting anything.

If the user selects the row, we have two cases:

- [1] If the displayed table is the parent of the main table of the mask, the current row of the main table is modified by populating the child fields of the relationship so that it effectively becomes a child of the selected row.
- [2] If the displayed table is a child but not a sub-entity of the main table, it is marked as a non-sub-entity child table, and the selected row is joined to the DataSet and modified to effectively become a child of the current row of the main table. This row will enter the saving process unless it is subsequently deselected or all changes are canceled.

All of this happens if the mask is in the edit or insert phase. If the mask is in the "set search" phase, nothing happens in case [2], while in case [1], during the search, the field connecting the main table will be joined to the filter to apply to the list.

### manage

This control is used to activate the display of a "list" type mask on a specific table or view. In this mask, it will be possible to add new rows, save them, and...
The tag has the form:

```plaintext
manage.tableName.editType
```

where `tableName-editType` identifies which page to display and its corresponding MetaPage.

It will be possible, in the opened mask, to select a row and return in this way to the starting mask with an effect similar 
to that described in the `Choose` command.

### insert, edit, delete, unlink

If present in the same container as a grid, they will be used to invoke the methods `insertClick`, `editClick`, `deleteClick`, 
`unlinkClick` described in [MetaPage](MetaPage.md).

### main commands

Every tag described in [MetaPage](MetaPage.md) related to the `commandEnabled` command causes the execution of the 
corresponding command. The button will be disabled if the `commandEnabled` function returns false for that tag.

The convention that if a filter is present in the `data-filter` tag, it will be applied to the function executed by 
that button also holds for buttons.


## DIV and SPAN

The AutoChoose and AutoManage tags cause the paginated display of a set of rows and the ability to select from this list. 
Since pagination is used, this list can be quite substantial. If, instead, you want to allow selection from a limited 
number of rows, you can use the SELECT tag. In this case, the DataSet will contain a cached copy of the rows to be displayed.

### AutoChoose

It is a tag that applies to DIV or SPAN containing a TEXT control with a data-tag related to a table and field 
`tableName.fieldName`.

The data-tag of the DIV or SPAN will be of the form:

```plaintext
AutoChoose.idTEXT.listType
```

The effect is that when you manually change the content of the TEXT, a list of the table indicated in the data-tag of 
the TEXT related to the specified listType will appear, filtered with the content of the TEXT when you leave the focus 
of the TEXT.

When a value is chosen from the displayed list, the list will be closed, and the value will be shown in the textBox. 
The Framework manages an invisible text field where the value of the `<key_field>` of that table will be stored. 
The data-tag of this hidden text will be:

```plaintext
parentTable.parentField?childTable.childField.
```

The table of the AutoChoose is usually the parent of the main table of the page's dataset.

To allow editing during modification or insertion of a new object into the mask, of a field of a table that is not 
the main one (in this case, it should be a sub-entity), the "data-subentity=true" attribute must be indicated on the html control.

The framework, through the DataRelation present on the DataSet, will be able to propagate the value of the `<key_field>` 
to the main row after the choice. The framework, in fact, recursively searches for a table that is related through a 
parent-child or child-parent relationship with a "single" key, and if it finds it, inserts that value into the record 
of the identified table. When saving is performed, the newly inserted row, which could also be a child of the main row, will have the `<key_field>` with the numeric id of the value chosen in the AutoChoose list.

### AutoManage

It is a tag that applies to DIV or SPAN containing a TEXT control with a data-tag related to a table and field 
`tableName.fieldName`.

The tag of the DIV or SPAN will be of the form:

```plaintext
AutoManage.idTEXT.editType
```

The effect is that when you manually change the content of the TEXT, the mask identified by the tableName-editType pair, 
where tableName is that indicated in the data-tag of the TEXT, which should be of type list, will appear. 
It is filtered with the content of the TEXT when you leave the focus of the TEXT.

In the mask that opens, it will be possible to select a row exactly as it happens with the `manage` command. 
It is similar to AutoChoose but opens a mask instead of a list.

During the setup of data reading and searching, the effect of the choose/autochoose tags is to create a hidden 
control on the field of the main table related to the parent table shown by autochoose/automanage. In this way, even if 
the TEXT tag refers to the parent table because it is that field that is displayed, it is, in fact, a field of the main 
table that is actually modified and searched, which is the expected behavior when selecting a value from a lookup table. 
All this happens in a completely transparent and automatic way.

To allow editing during modification or insertion of a new object into the mask, of a field of a table that is not the 
main one (in this case, it should be a sub-entity), in this case as well, the "data-subentity=true" attribute must be 
indicated on the html control.

## Custom controller

Custom controls are controls different from the previous ones and managed with custom behaviors, which depend on the control. 
This allows you to write and integrate any visual component that implements a simple interface. Once the class that manages it, 
the custom-controller, is created, it is possible to insert instances of these controls into the masks, simply by specifying 
in the `data-custom-control` attribute the code of the controller associated with it.

It is obviously possible to define other attributes depending on the controller you intend to create.

During the preScan phase, each custom-control is associated with an instance of its relative custom-controller, and this 
instance is also associated with its `data-customController` attribute. The `init` method of this instance is invoked at 
this stage.

The constructor of the CustomController must have the interface:

```js
new CustomController(el, helpForm, table, primaryTable)
```

where:

- `el` is the html element to which the controller is associated
- `helpForm` is the instance of HelpForm associated with the MetaPage
- `table` is the DataTable to which the controller refers
- `primaryTable` is the DataTable of the main table of the mask

The new custom control, to interact with the rest of the framework's logic, must implement a series of methods and then 
must be added to the collection of custom controls using the statement:

```js
    window.appMeta.CustomControl("grid", <MyControl>);
```

So, for example, a new custom control "myControl" will have the following structure:

```js
(function() {
    function myControl(el, helpForm, table, primaryTable) {
        if (this.constructor !== myControl) {
            return new myControl(el, helpForm, table, primaryTable);
        }
        return this;
    }
    window.appMeta.CustomControl("myControl", myControl);
}());
```


### Functions to implement

As we mentioned in [MetaPage](MetaPage.md), the main methods that a custom controller must implement are:

- `fillControl`: Based on the content of the `table` passed in the constructor parameter, it populates the graphical control.
- `getControl`: Based on the usual `data-tag` set on the control and the value it takes, it populates the underlying dataset.
- `clearControl`: Performs a reset, both graphical and internal auxiliary structures.
- `preFill`: It binds to the preFill event of the form, so this method must be implemented if there is a need to load the control with starting data. As happens, for example, for comboboxes.
- `getCurrentRow`: Returns a JavaScript object with this structure: `{ result: boolean, changed: DataTable, rowChanged: ObjectRow }`, i.e., an object where the currently selected row on the control is possibly indicated. Remember that the custom control can display more than one row of a certain table.
- `addEvents`: In this method, you can subscribe the new control to react to some events of the framework itself, such as the ROW_SELECT event, and thus trigger logic within the control following the selection of a new row in the hosting form.



### calendar - CalendarControl

The `data-custom-control` in this case is set to "calendar". The `data-tag` is in the form tableName.listType.editType where:

- `tableName`: Name of the table from which the data to be displayed must be taken.
- `listType`: Listing-Type to use, i.e., the symbolic name of the desired list.
- `editType`: Edit-Type to use for modifying the row when "double-clicking" on the calendar or pressing the add/modify button.

Example:

```html
<div data-tag="lesson.default.default" data-custom-control="calendar"></div>
```

The constructor is `CalendarControl(el, helpForm, table, primaryTable, listType, isListManager)`.

It is a control that displays a calendar, where each date can correspond to a row in a table.

Like grids, it has the ability to include buttons that enable insertion/modification/deletion:

- `data-mdlbuttoninsert`: If present, a button for inserting rows will be available.
- `data-mdlbuttonedit`: If present, a button for editing rows will be available.
- `data-mdlbuttondelete`: If present, a button for deleting rows will be available.

Then there are other attributes:

- `data-mdlstartcolumnname`: Field used for the start of displayed events (if absent, the field named start is used).
- `data-mdlstopcolumnname`: Field used for the end of displayed events (optional).
- `data-mdltitlecolumnname`: Field used for the title of events.
- `data-mdlmaincolor`: Background color, default is #0275d8 (optional).
- `data-mdlweekend`: Enables the selection of weekends.
- `data-mdldragdrop`: Enable drag and drop of events, which influences the underlying data row and changes the values of start and stop.

```html
<div id="calendar37" data-tag="lezione.attivform.attivform" data-custom-control="calendar" data-mdldragdrop></div>
```

As with the grid, pressing the edit button opens a new MetaPage to update the associated detail object. Upon returning 
from the detail page, by pressing "ok," the control will be refreshed with the newly modified information. 
The same goes for insertion.

When the calendar is called within a ListManagerCalendar, the `isListManager` parameter in the constructor will be true.

### checklist - CheckBoxListControl

This tag is used for selectable/deselectable lists.

The `data-tag` has the following format: tableName.listType where:

- `tableName`: Table from which values to be shown must be taken.
- `listType`: Listing-Type to use, i.e., the symbolic name of the desired list.

Example:

```html
<div id="checklist1" data-tag="childTable.listtype" data-custom-control="checklist"></div>
```

The checkbox list represents the connection between two entities that have a many-to-many relationship. 
When rows are selected on the list and saved, a new record will be created in a linking table. 
The "linking" table is automatically calculated from the dataset. This table must have the following characteristics:

1. Possess a parent-child relationship with the main table of the form, where the main table of the form is the parent, and the linking table is the childTable.
2. Possess a parent-child relationship with the table specified in the control tag, where the table in the tag is the parent, and the linking table is the child.

The linking table will then contain the ids of the 2 parent tables to which it is linked. Similarly, 
when I deselect a row in the list and save, a row from this linking table will be deleted from the database.

The checklist visually appears as a grid. The columns are described by the `describeColumns()` function depending on the ListType specified in the tag.

The control has a first column consisting of checkboxes that can be selected or deselected.


### combo - ComboManager

The tag of a `data-custom-control` "combo" is `tableName.field`, where `tableName` is the name of the main table, and `field` is the field of the main table. This custom control is used to manage controls with SELECT tags. The tables associated with the SELECT are automatically cached (read only once) in the DataSet of the mask in which they are located.

**Note:**
It is not necessary to set the `data-custom-control` tag for the SELECT, as it is automatically added (during the pre-scan phase) where it is not present.

However, other attributes must be set for the control to function:

- `{string} data-sourceName`: Name of the table used for the displayed rows (mandatory).
- `{string} data-value-member`: Name of the field in `sourceName` used to extract the value (mandatory).
- `{string} data-display-member`: Name of the field in `sourceName` to show in the dropdown (mandatory).
- `{string} [data-no-blank]`: If present, a blank row is NOT inserted. By default, the first selectable value in the dropdown is a blank row that results in inserting a NULL in the corresponding field.
- `{string} [data-master]`: Name of the master table on which this combo depends, if present. If present, every time a row is selected from the master table, the data source of this SELECT is redrawn, filtering only the rows of the table `data-sourceName` that are children of that master row.

Let's see an example of using a combo. Suppose we have a field "idregistryclass" in a form "Anagrafica" that indicates the type of class. There is a table named "registryclass" that has two fields: `idregistryclass` and `description`, where `idregistryclass` is the primary key. The field "idregistryclass" of "registryclass" is, therefore, a foreign key for the registry table. We want to use a ComboBox to select the class type in the "Anagrafica" form.

In this case, the attributes to set are:
- `data-tag`: registry.idregistryclass
- `data-source-name`: table "registryclass"
- `data-value-member`: "idregistryclass," the primary key of the "registryclass" table
- `data-display-member`: "description"

Below is how this select control should be configured in the HTML:

```html
<select data-tag="registry.idregistryclass"  
    data-source-name="registryclass" 
    data-value-member="idregistryclass"  
    data-display-member="description" 
    data-custom-control="combo">
</select>
```


#### Meccanismo master detail grid/combo:

La griglia (grid o gridx) e il combo supportano il meccanismo automatico del master detail.

Potremmo avere una combo o una griglia master ed una combo oppure una griglia detail.

Per realizzare questo comportamento bisogna configurare il data-attribute data-master="<nome tabella>". 
Tale attributo ha il valore di un nome di un DataTable presente sul dataset. Rappresenta la tabella master appunto. 

Dovremmo avere nella form quindi una combo oppure una griglia che abbia come tabella principale impostata proprio 
quella indicata sul data-master. Quando si seleziona una riga nella griglia o un valore nella combo o nel grid "master", 
automaticamente nel controllo figlio saranno filtrate le righe in base alla relazione che intercorre tra la tabella master 
e la tabella child.


### gridx - GridControlX

It is a grid with small buttons on the side that displays a table.

In this case, `data-custom-control="gridx"`.

The `data-tag` has the following format:

```
tableName.listType.editType
```

Where:

- `tableName`: Table from which the data to be displayed is taken.
- `listType`: The code of the desired list.
- `editType`: The Edit-Type to use for editing the row, when double-clicking on the grid or clicking the add/modify button associated with the grid.

In the `DescribeColumns()` function, different configurations regarding visibility, position, and caption to be displayed in the header can be inserted depending on the `listType`.

Sorting is configured in the `GetSorting()` function.

Example:

```html
<div data-tag="registrypaymethod.default.lista" 
     data-custom-control="gridx">
</div>
```

#### Buttons for the Grid

If we want the buttons for edit, add, or delete to be shown on the grid rows, we need to add the following data attributes:

- `data-mdlbuttonedit`: Pressing the edit button on the grid row opens the detail for editing the row. The detail form will be a class derived from MetaPage, identified by `tableName`, the name of the table to which the selected grid row belongs, while the `editType` will be that of the grid tag. Note that, being the MetaPage a "detail" page, the third parameter in the constructor must be passed as "true": `MetaPage.apply(this, [<TableName>, <EditType>, true]);`

- `data-mdlbuttoninsert`: Pressing the insert button located on the right of the grid header opens the detail for inserting a new row. As in the case of the edit button, described earlier, a new MetaPage is opened, identified by `tableName` and `editType`. The page will usually be the same one implemented for the edit button. In this case, the framework will populate the controls with default values read from the server, and any auto-incrementing IDs will also be populated by the server. On-screen, there is no need to show auto-incrementing IDs, but it should be noted that the underlying DataSet will already have these fields populated, even if with temporary values.

Whether in the edit or insert case, the user can press the cancel button on the toolbar and return to the master page, or press save. The framework takes care of closing the detail page and replacing the controls of the master page. When save is pressed from a detail, the changes are not actually saved to the database, but information about the modified rows is saved in the dataset associated with the main MetaPage. Only when the save button is pressed from the main page's toolbar, the server-side service is invoked to post the data to the database.

- `data-mdlbuttondelete`: The delete button appears at the bottom of the row. If the delete button is pressed, that row will be deleted from the underlying dataset. The grid is refreshed on-screen, and the row will no longer appear. As mentioned earlier, in this operation, there is no modification of the database. Only when the save button is pressed from the main page's toolbar, the row will be deleted from the database.

- `data-mdlbuttonunlink`: It is used to unlink the current row of a grid from the main table. A necessary condition for this to happen is that the DataGrid is associated with a table CHILD of the main table, which is not a sub-entity. In this type of situation, the row is not deleted from the database; instead, the fields that make it a "child" of the main table are set to null. The operation is the reverse of what happens when choosing from the same table; in that case, the fields are set to make the row (re)become a child of the main table.

Example:

```html
<div id="grid1" 
    data-tag="registrypaymethod.anagrafica.anagrafica" 
    data-custom-control="grid" 
    data-mdlbuttoninsert data-mdlbuttonedit data-mdlbuttondelete>
</div>
```

Every time there is a combo, gridx, or grid that displays a table T, myKode calls the `DescribeColumns()` client method, 
which in turn calls the respective `DescribeColumns()` method of the backend MetaData named T to have it set up the table 
according to the specified ListType. This operation is done once per session. The information about the columns described 
for a particular grid is saved in a "cache" on the browser.

### Detail Masks

The grids on main pages usually represent lists of entities associated with the main entity. These grids can, as we have 
seen, have buttons for editing and adding new rows. To do this, a new MetaPage must be designed, which, depending on 
the `tableName` and `editType`, will be associated with a new dataset. The page that opens will, therefore, be a detail 
for the main page.

All changes made in the detail will be poured onto the child entities of the main entity in the dataset. In particular, 
these entities are called sub-entities and have the peculiarity that the entire key of the main table is present in the 
key of this sub-entity table.

From the graphical interface, when we open a detail from a grid, only the ok and cancel buttons will be shown. Both lead 
back to the main mask: if I press ok, the changes made in the detail will be poured onto the main dataset. Only when the 
save button is pressed from the toolbar, however, will these changes be actually saved to the database. 
The two datasets that come into play, i.e., that of the main page and that of the MetaPage for editing the sub-entity, 
must have the same subset of tables subject to modification, with the same keys, and the same relationships. 
If this were not the case, the data propagation from the "child" to the "parent" dataset would not work. 
In particular, the DataSet of the "parent" mask must contain all the tables that can be modified in the "child" mask, 
with the same relationships.

To perform a quick debug and see if the dataset of the main page has the rows of the sub-entity that we expect after an 
insert or edit, we can press "click + ctrl + shift" on an empty spot on the web page, to open a debug dialog where it 
is possible to view the tables with the rows and various properties.

### Passing Parameters to MetaPage

When passing from a main MetaPage to a child meta-page through the edit buttons of the grid, or through the Manage 
button when opening a new main MetaPage, it is possible to pass parameters from one MetaPage to another, 
with two main methods:

#### 1. `state.setCallingParameter()`

It is possible to invoke, in the MetaPage of the calling form, before opening the detail mask, the `setCallingParameter` 
method of the `state` property (which is an instance of `MetaPageState`).

Example:

In the calling mask, for example, in a `rowSelect()` event:

```js
this.state.setCallingParameter("parametro", "valore");
```

On the called MetaPage, it will be possible to access this parameter using the `getCallingParameter` method of the `state`:

In any method of the

called mask:

```js
let val = this.state.getCallingParameter("parametro");
```

#### 2. `DataTable.extraParameters`

Use the `extraParameters` property on the `DataTable` of the main table of the caller, present on the dataset of the calling page.

So, on the calling MetaPage, we will have an assignment like this:

```js
this.state.DS.tables["childTable"].extraParameters.myCustomProperty = "Value".
```

On the called MetaPage, we will have the parameter `myCustomProperty` available on the `extraParameters` property:

```js
let val = this.state.extraParameters.myCustomProperty;
```

For example, if we want to pass the value of a certain column of the main row, we insert the following code in the calling MetaPage:

In the constructor, we register for the `stopMainRowSelection` event:

```js
this.eventManager.subscribe(appMeta.EventEnum.stopMainRowSelectionEvent, this.rowSelected, this);
```

Handler method:

```js
rowSelected: function(dataRow) {
    this.state.setCallingParameter("myId", dataRow.current.id);

    // or

    this.state.DS.tables[<TableNameChild>].extraParameters = { myId: dataRow.current.id };
}
```

### Custom Filter via customParentRelation (for grid and gridx)

Grids usually represent a list of items that are details of a main entity. The framework, automatically depending on the 
main form's main row, filters the grid items based on the relationship between the table associated with the grid and the 
main table. Therefore, the dataset must have the parent-child relationship appropriately configured.

We can also filter the grid rows based on a filter of our choosing, automatically.

In the `beforeFill()` method of the MetaPage, we could insert such a filter. We must set the following data attribute via jQuery:

```js
$("#GRID_ELEMENT_ID").data("customParentRelation", filter);
```

Where the `filter` parameter will be any jsDataQuery expression that we have calculated at that moment. 
Let's take an example where the grid needs to be filtered based on the main row and, additionally, also combined with a 
value that we know:

```js
let parentRow = this.state.currentRow;
let gridParentRels = this.state.DS.getParentChildRelation('<main_table_name>', '<grid_table_name>');
let parentFilter = gridParentRels.getChildsFilter(parentRow);
let q = window.jsDataQuery;
let customFilter = q.eq("<my_column>", "custom value");
let filter = q.and(parentFilter, customFilter);
$("#GRID_ELEMENT_ID").data("customParentRelation", filter);
```

##### Computed Fields
On every grid (grid or gridx), it is possible to have columns where the values are computed fields. For this purpose, 
it is possible to associate formulas with the columns or use the `computeRowsAs` method of MetaModel. 
This function will be invoked within the framework at the necessary points for each row of the original table.

In the metadata:

```js
describeColumns: function (table, listType) {
  appMeta.metaModel.computeRowsAs(table, listType, this.calculateFields);
  return this.superClass.describeColumns(table, listType);
}

calculateFields: function (r, listType) {
  var tableToFill = r.getRow().table;
  var ds = tableToFill.dataset;
  // Custom code
  r[<Column Name to Fill>] = "Calculated Value";
}
```

Alternatively, it is possible to set the `expression` property of a `DataColumn` of the DataTable, using the `columnExpression` 
method of columnExpression (or assigning directly to the `expression` field of the DataColumn). In this case:

- If the assigned expression is of type jsDataQuery, it will be evaluated at the time of reading or writing the row.
- If the expression is a string in the format `table.field`, `table` will be a parent table, related to the main table, and the specified field will be taken from the related row.

### Formatting Numeric or Date Values

If, in a grid, we want numeric and date values to appear in a certain way, we must perform a configuration on the properties 
of the DataColumn of the relevant table. This configuration can be done in the metadata in the `DescribeColumns(table, listType)` 
function.

For example, we could write in the metadata:

```js
describeColumns: function (table, listType) {
    //...
    table.columns.start.format = "g";
    table.columns.latitude.format = "fixed.7";
}
```

The `fixed.7` indicates a number with 7 decimal places. For example, if we want to show latitude or longitude.

As for the formatting of textboxes, the default value for dates is "d", so the value will be displayed in the dd/MM/yyyy format.

### Lookup (grid, gridx, checklist)

On grids and checklists, an additional parameter can be configured in case we want to create a coded display on some columns. 
Simply set the `data-mdlconditionallookup` attribute with a string in the following format: 
"col1,v1,d2;col1,v2,d2;col2,v3,d3;...". That is, each column is separated by a semicolon, while the triplet of values 
separated by commas indicates: the name of the column col(i), "v(i)" is the value to be replaced with "d(i)".



### Grouping and Aggregation Functions (gridx only):

By default, gridx grids have the ability to group columns and configure aggregation functions to be calculated on numeric 
columns through the options button that appears at the top left. 
To insert the column into the group, simply drag and drop the column header into the appropriate area. 
If you want to remove it, you can press the button next to the box of the grouped column or drag and drop it in the 
opposite direction, taking the box of the column and dragging it anywhere in the grid.

To disable this behavior and remove the ability to drag and drop on the grouping area, you need to add the 
`data-mdlexcludegroup` data attribute to the control.

### tree - TreeViewManager:

To manage a tree view, it is necessary to set the `data-custom-control` attribute to "tree".

The `data-tag` will have the format `tableName.tree`.

The simple case is when you want to display the tree of a table where there is a self-relationship, that is, a 
relationship where the parentTable and childTable are the same table.

Therefore, you need to indicate on the `data-tag` the name of the table where the self-relationship is present, without 
specifying the fields of the self-relationship. The framework will automatically retrieve the relationship from the 
dataset, followed by the keyword "tree".

Also, you need to indicate in the `data-custom-control` attribute the name of the class that manages the tree 
(which could be "tree" or the code of a custom manager).

If you do not need to include particular behaviors, simply insert the string "tree", and the logic of the control will 
be managed by the framework's `TreeViewManager` class.

If you need particular behaviors, you will need to extend this class and use a new key for the new `CustomControl`.

For example:

```js
(function() {
    var TreeViewManager = window.appMeta.TreeViewManager;

    function table1_TreeViewManager() {
        TreeViewManager.apply(this, arguments);
        this.doubleClickForSelect = false;
    }

   table1_TreeViewManager.prototype = _.extend(
       new TreeViewManager(),
       {
           constructor: table1_TreeViewManager,
           superClass: TreeViewManager.prototype
       });

   appMeta.CustomControl("table1", table1_TreeViewManager);
   appMeta.table1_TreeViewManager = table1_TreeViewManager;
}());
```

The logic of the fields to be displayed and which node and root to start from for the tree generation is performed in 
the `DescribeTree()` method of the metadata.

This method is invoked at the beginning when the html page is read, and the various `CustomControl`s are instantiated 
to handle grid, combo, and tree controls.

In this function, the class responsible for creating the nodes, the so-called `TreeNode_Dispatcher`, will be instantiated, 
which has the `getNode(parentRow, childRow)` method and the filter representing the condition for the tree's root, which 
will be a jsDataQuery expression.

The framework provides two different node management systems for the tree:
1. UnLeveled
2. Leveled

In the case of UnLeveled, the `TreeNode_Dispatcher` class will need two pieces of information, the `<label_field>` of 
the `<tree_table>` used for visualization, and the `<child_self_relation_key_field>` representing the child column of 
the self-relationship. The function that constructs and can be overridden by the class extending `TreeNodeUnLeveled` 
is `nodeText()`.

The UnLeveled node by default will show:
`<child_self_relation_key_field> <label_field>`












### Tree Navigator Control:

This is a particular composition of gridx or grid controls and a tree, where one controls the other, typically used in 
"manage" type forms, where you want to navigate the tree for an item selection. The configuration in the HTML is as 
follows (Example of a tree on accmotive):

The meta-page should have the following boolean configurations:

```js
this.isList = true;
this.isTree = true;
this.mainSelectionEnabled = true; // (if you want the select button to appear, typical of controls with "manage" tags)
```

The gridx must have the tag: `data-treenavigator`, which allows for special handling.

```html
<div class="row">
  <div class="col-md-8">
    <div id="tree_accmotive" data-tag="accmotive.tree" data-custom-control="tree_accmotive"></div>
  </div>
  <div class="col-md-4">
    <div id="grid_accmotive" data-tag="applied.tree" data-treenavigator data-custom-control="gridx"></div>
  </div>
</div>
```

On the calling MetaPage (of the registry table, having a view named `registrymainview`), you will have:

```html
<div class="row" data-tag="AutoManage.txtCodiceCausaleCredit.tree">
   <div class="col-md-6">
       <button type="button" data-tag="manage.accmotive_credit.tree">Credit cause</button>
       <br/>
       <label class="col-form-label" for="txt_causalecred_id">Credit cause</label>
       <input type="text" class="form-control" name="txtCodiceCausaleCredit" id="txt_causalecred_id" data-tag="accmotive_credit.codemotive?registrymainview.codemotivecredit" />
   </div>
   <div class="col-md-6">
       <textarea  class="form-control" id="txta_causalecred_id" data-tag="accmotive_credit.motive"></textarea>
   </div>
</div>
```

### Grid - GridControl

In this case, `data-custom-control="grid"`

The control is very similar to gridx but does not allow column grouping and does not include editing/modifying/deleting buttons.

### Upload - UploadControl

`data-custom-control = "upload"`

UploadControl is a custom control dedicated to uploading file attachments to the server. It consists of a "choose file" 
button to select the file on the local PC, a label displaying the file name, and a button to invoke the method of the 
Attachment.js module to make server calls. Once the file is sent to the server, a label will appear to allow removal 
of the attachment, and optionally to upload another file.

All these dynamics occur transparently for the interface and backend programmer, who only needs to execute the following 
configuration:

On the HTML side, it is necessary to insert the following tag:

```html
<div id="custom_id" data-tag=”tableName.columnName” data-custom-control="upload"></div>
```

For the control to function correctly, the following assumptions must be made:

- The dataset must have an "attach" table that contains all the information for each attachment, including the id, the 
- file name as saved on the server file system, the size, and the counter for the attachment cleanup algorithm that will be discussed later.

- There must also be the specific table, the one indicated in the HTML tag "tableName," where the column specified in the "columnName" tag will be present. In this column, we will insert the reference of the attachment that the server returns to us after the server call. The crucial thing is that this column must have "idattach" as a prefix in the name. Therefore, there must be a parent-child relationship between "attach" and "tableName" on the "idattach" field of the parent table ("attach") and the "columnName" of the child table ("tableName").

After making this configuration, the control will be able to:

1. Load the file, of any size, as the attachment.js module performs packetized loading (1Mb packet size sent).
2. Associate the id of the attachment returned by the server with the main row of the form, which must correspond to "tableName," exactly corresponding to the id of the new row in the attach table.
3. Show links to remove the uploaded file.

When the user presses "mainsave" on the toolbar, the backend method will have the logic, depending on the row's state, 
to update the value of the "counter" column on attach. In particular, the following algorithm will be executed:

1. The row, when created in upload, has `counter = null`, meaning the attachment is sent but not yet referenced by a persistent row in the database.
2. When pressing "mainsave," set `counter = 1`, meaning that the attachment becomes associated with a persistent row in the database.
3. If I delete the row, the attachment's connected counter will be zero, indicating that the file can be removed.
4. If I modify a row, thus going from null to an idattach or vice versa, or choose an attachment and connect another, the old row will have `counter = 0`, while the new one will have `counter = 1`.

It is essential to note that saving the DataSet where the attach table with the counter information is contained is done 
in the same transaction as the page dataset where the reference row is contained. Therefore, we will be sure of the 
synchronization of the database with the file system where the attachments are stored.

At this point, a database procedure, scheduled for example at night or at predetermined system downtime, will take 
care of deleting zombie files, i.e., attachments that have no reference. This logic will then delete all files whose 
counter is zero or null and whose insertion date is greater than 24 hours. This way, we are sure that it is not a 
newly sent attachment that the user has not yet connected to any row but suppose it will be done shortly.

On the server side, the files will be saved in a local folder, configured in the private variable `UploadPath` of the `FileController` controller. 
This could also be changed, for example, if it is decided to upload files to a remote file system or another type of memory.



### bootstrapTab - BootstrapContainerTab

This is not a custom control but a custom container. It is used to add the `focusContainer` method to Bootstrap "container" tags, which is used to select the correct tab when you want to focus on a control contained within it.

To use controls inserted in bootstrap tab pages, it is advisable to use the `data-custom-container` tag and set it equal to the value "bootstrapTab".

Example:

```html
<div id="externalTab" class="container" data-custom-container="bootstrapTab">
```

### dropdowngrid - DropDownGridControl

In this case, the `data-custom-control` is dropdowngrid.

The `data-tag` will have the format `tableName.listtype`.

The `data-custom-control` is to be applied to input - TEXT-type controls. When applied, it causes a grid to appear when typing text in the TEXT control, filtered based on the entered text.

Although TEXT refers to the parent table to which the displayed values belong, during the reading and setting of the data filter, the field of the main table linked to the parent table will be used, as expected. This is achieved through the automatic addition of an invisible textbox on this field.

Attributes for customizing the control:

- `data-listtype`: listType of the list to display for the parent table.
- `data-minchar`: number of characters for which the appearance of the list is activated (default in `appMeta.config.dropDownMinCharTyped`).
- `data-delay`: milliseconds to wait before the appearance of the list (default `appMeta.config.dropDownDelayKeyUp`).

### graph - GraphControl

In this case, the `data-custom-control` is graph.

The `data-tag` is not present in this control.

Attributes for customizing the control:

- `data-tname`: name of the table containing the data for the graph.
- `data-ycol`: name of the field containing the ordinate values.
- `data-xcol`: name of the field containing the abscissa values.
- `data-type`: can be bar or line.
- `data-title`: column to use for column titles.



### gridxmultiselect - GridControlXMultiSelect

Similar to gridx, but it allows the selection of multiple rows in the grid. However, the selection is purely visual 
and has no effect on the data 

