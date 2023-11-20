[![it](https://img.shields.io/badge/lang-it-green.svg)](https://github.com/TempoSrl/myKode_Frontend/blob/master/readme.it.md)

# Frontend myKode

The myKode frontend is a framework that allows the development of sophisticated web forms with minimal code.

The JavaScript frontend is a rich client, enabling interaction without continuous postbacks.

Through services provided by the backend (available in both Node.js and .NET versions), it performs a set of operations that allow "normal" operations on web forms. It also allows easy extensibility in terms of both the visual components contained in the form and the specific interaction functions the form may require.

A generic form is associated with a [DataSet](https://github.com/TempoSrl/myKode_Backend/blob/main/jsDataSet.md) (similar to those in ADO.NET), containing a local copy of a set of rows present in the database (or that will be in the future).

By "normal operations," it is meant, for example:

- The ability to set up a search in "query by example" mode, entering the data to be compared in the form, and then initiating the search based on the entered data [1].
- Modify existing data.
- Insert new data [2].
- Open "detail" forms (even second or third level) on the "child" rows of the main row.
- Delete a row and all its related details.
- Display lists based on the selection of parent rows of the main row to populate fields in the main table.

The basic idea is to have a DataSet (similar to those in ADO.NET) to store the local copy of the data objects being processed and operate on the database based on a set of conventions and properties of the DataSet's columns, as well as the rows (DataRow) contained in DataTables.

However, the DataSet is not intended to contain any set of rows from the database but data that must adhere to a certain logic.

## Main Table and Sub-Entities

In particular, there is a "main" table that contains a "main" processing object.

The main table within the framework is defined as an *entity*. We will interchangeably refer to the main table or main entity of a form.

For example, it could be a row from an address book table or an order table.

Then (optionally), there are a set of "sub-entities," representing details of the main row.

In the case of an address book, these could be an "address" table with various addresses for that person (office, fiscal domicile, residence, etc.) or a "phone" table with various phone numbers.

In the case of an order, it could be a "order_detail" table with details of the ordered goods.

### Relationship: Entity - Sub-Entity or Sub-Entity - Sub-Entity

The relationship between the entity and sub-entity is not generic but must connect **the entire key** of the parent table with **key fields** of the child table.

This logically guarantees that there can never be a row in the sub-entity table not connected to any parent row (entity or sub-entity). A sub-entity is, in fact, considered a **detail** of the main entity.

The "main" row is the one selected from the search performed with the "query by example" mentioned in point [1] above, or the row created in point [2].

There may also be other referenced tables in the DataSet, parents of entities and sub-entities, which are not subject to modification by the form. During user data editing, the distinction between these two sets of tables is crucial. The tables subject to editing (entities and sub-entities) will never be re-read from the database while the user interacts with the form, to avoid losing any modifications being made. Similarly, a row (DataRow) in the insertion state (entity or sub-entity) would be lost if that table were accidentally re-read in the corresponding DataTable.

Conversely, parent tables can be re-read, for example, to select a new parent row for the main row or simply to update them if they have changed in the meantime, as can happen with tables with highly volatile content.

When creating a form, it must be decided which is the main table and which sub-entities can be modified in that form and in its possible detail forms. These tables should be added to the DataSet and related.

Tables that serve to improve the visualization of the first set of tables, typically parent tables, should be added to the DataSet and related by inserting the appropriate DataRelations.

## Automatic Reading and Writing of the DataSet

The advantage at this point is that the framework knows how to fill the entire DataSet when the user selects a row from the list. Similarly, if the user decides to delete the main row, the framework already knows which rows in the detail tables to delete. Finally, during insertion, the framework knows the order in which to insert the rows and how to propagate the calculation of incremental key fields from parent tables to child tables.

Conversely, tables that are not entities or sub-entities will never be written during the save operation of a form.

## Data Display

The design of a web form is done with simple HTML tags, where attributes specify a data-tag attribute to indicate which field from which table will be displayed in that control.

In each form, fields of the main table are normally visible and editable (unless this behavior is disabled). It is also possible, where a sub-entity is in a 1:1 relationship with the entity (at least in the context of the current view), to display and allow editing of the fields of its row. An example of such a table could be a table containing a taxpayer's income tax declaration, and it is decided to display, in a certain form, only the row for the current year.

In this case, the income tax table could be filtered by fiscal year, and with this premise, it becomes a 1:1 relationship with the taxpayer table, so the income tax declaration data could be displayed in a form where the main table is the taxpayer.

In other cases, where a table is not a sub-entity and/or not in a 1:1 relationship with the rows of the main table, it will not be possible to display the fields of that table in "simple" controls, such as input-text or similar, but only in HTML tables, which allow displaying multiple rows.

Thanks to these premises, the framework automatically fills in the fields of the web form that have the data-tag attribute, which is of the form "table.field".

Similarly, when necessary, the framework can read the data from the form and update it in the appropriate rows of the DataSet.

For further details on composing the HTML of a page, refer to [MetaPage HTML](MetaPageHtml.md).

## Data Modification Cycle

It is also possible to add any behavior to the form, and, in essence, it is not necessary to read or write to HTML controls.

In fact, the convention for reading or writing form data is to use the following scheme:

1) Invoke the getFormData() method of MetaPage, which reads the form data, updating the DataSet's content.
2) Operate on the DataRow of the DataSet at will, modifying or inserting data into the entity and sub-entity tables.
3) Invoke the freshForm() method of MetaPage to display the DataSet's data in the web form.

This way, the code becomes independent of the specific knowledge of which control and what type contains each field that needs to be processed.

## Application Structure

Usually, each table is associated with a class derived from MetaData (the "metadata"). The metadata contains all the information about the table

in a centralized manner, as we will see shortly.

If the table is subject to modification on some page, each page is built using an HTML file and a class derived from MetaPage. A table might be viewable or editable through different pages, so there is a need to assign a code to each, which is defined as editType.

Therefore, the tableName-editType pair identifies a form in the context of the application, where tableName is the main table of that form (and the underlying DataSet).

If the table appears in some list viewable by the user, the field names and characteristics of the list are described in the metadata. Since, in this case as well, there may be a need to list a table (or view) in different ways depending on the context, each list is associated with a code, called listingType.

Therefore, the tableName-listingType pair identifies a type of list in the context of the application.

### MetaApp

The highest-level element of a myKode application is usually the [MetaApp](MetaApp.md) class, which is responsible for registering and providing all the pages ([MetaPage](MetaPage.md)) and [Metadata](https://github.com/TempoSrl/myKode_Backend/blob/main/jsMetaData.md).

MetaApp manages the stack of pages that are successively opened and closed and the passing of data between them.

Usually, it is not necessary to derive a subclass, but it is possible to customize it to change the folder where it retrieves the files and metadata on the server.

It is necessary to register all pages and metadata with the methods of MetaApp. In particular, the method

```javascript
addMeta({string}tableName, {[MetaData](https://github.com/TempoSrl/myKode_Backend/blob/main/jsMetaData.md)} Meta)
```

is used to associate the name of a table with the constructor of its metadata, and similarly,

```javascript
addMetaPage({string}tableName, {string} editType, {[MetaPage](metapagehtml.md)}metaPage)
```

is used to associate the tableName-editType pair with a page (MetaPage).

### MetaData

A [Metadata](https://github.com/TempoSrl/myKode_Backend/blob/main/jsMetaData.md) is a JavaScript class that describes the properties of a table.

It should be noted that these properties are set as attributes of DataTables and DataColumns of the DataSet. The DataSet contains all the information about all the tables that compose it.

Using the metadata to set them, instead of repeating these settings in other places, such as in all forms that should use these tables, is crucial to avoid repeating code and make their maintenance effective.

Moreover, this information is used by the framework whenever it is needed, such as creating new rows in a table or validating the data of a row.

Since there is only one place where we describe these properties, it will be more convenient both to retrieve them and to change them safely.

### MetaPage

The [MetaPage](MetaPage.md) is the class that contains the "common" code for all pages, such as control management, toolbar command management, filling the form with dataset data (freshForm), and reading form data into the DataSet (getFormData).

MetaPage is usually derived to implement all user pages and offers specific methods (hooks) to integrate the base behavior with specific functions of each page.

Therefore, if classes derived from MetaData contain general information about each individual table, shared by the entire application, classes derived from MetaPage describe the behavior of each individual page.

Each web page managed by the myKode frontend is divided (at least) into two parts: the HTML and the corresponding MetaPage, which is a class derived from MetaPage and has the peculiarities of that page.

The frontend can, if necessary, access many backend services to read/write data, generally using objects of type [sqlFun](https://github.com/TempoSrl/myKode_Backend/blob/main/jsDataQuery.md) for filters and [DataSet](https://github.com/TempoSrl/myKode_Backend/blob/main/jsDataSet.md) to manage the data.

