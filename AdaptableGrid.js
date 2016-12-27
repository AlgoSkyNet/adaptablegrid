$.fn.AdaptableGrid = function (options) {
    
    /**
     * AdaptableGrid.__constructor
     * Initialise the grid object
     * @constructor
     * @param {object} options - A list of options
     * @returns {AdaptableGrid}
     */
    this.__constructor = function (options) {
        
        // Initialise the options property with some defaults
        this.options = $.extend({
            columns: [],
            data: [],
            sort: null,
            filter: null,
            edit: null,
            ordering: null,
            pages: null,
            search: null,
            styles: null,
            display: null
        }, options);

        this.columnValueToIndex = {};
        this.columnIndexToValue = {};

        this.read();
        return this;
        
    }

    /**
     * AdaptableGrid.read
     * Reads in the data to create a singleton list of type Cell
     * @returns {void}
     */
    this.read = function () {
        
        debug.start("AdaptableGrid.read");
        this.cells = [];
        this.columns = [];
        
        this.width = options.columns.length;
        this.height = options.data.length + 1;
        dimension = this.width * this.height;
        
        for (i=0; i<this.height; i++) {

            this.cells[i] = [];
            
            if (i==0) {
                // This is the column headers
                for (j=0; j<this.width; j++) {
                    this.cells[i][j] = new Cell(i, j);
                    this.cells[i][j].setValue(options.columns[j].title);
                    this.cells[i][j].setFormat("$txt");
                    this.columns.push(options.columns[j].field);
                }
            }
            else {
                // Regular row
                for (j=0; j<this.width; j++) {
                    this.cells[i][j] = new Cell(i, j);
                    this.cells[i][j].setValue(options.data[i-1][options.columns[j].field]);
                    this.cells[i][j].setFormat(options.columns[j].format);
                }
            }

        }

        debug.end("AdaptableGrid.read");

    }

    /**
     * AdaptableGrid.render
     * Prints out the grid to the DOM
     * @param {integer} [num] - The number of rows to display
     * @param {function} [callback] - The function to run after rendering is finished
     * @returns {void}
     */
    this.render = function (num, callback) {
        
        debug.start("AdaptableGrid.render");
        if (num == null) {
            if (options.display == null) {
                num = this.height - 1;
            }
            else {
                num = options.display;
            }
        }

        this.displayHeight = num + 1;

        var table = '<table>';

        // Output all the cells
        for (i=0; i<this.displayHeight; i++) {

            if (i == 0) {

                for (j=0; j<this.width; j++) {

                    if (j == 0) {
                        table += '<thead>';
                    }

                    table += '<th class="adaptablegrid adaptablegrid-header" blotter="abjs:' + i + ":" + j +'">'
                                + this.cells[i][j].getFormattedValue(this) + '</th>';

                    if (j == this.width-1) {
                        table += '</thead><tbody>';
                    }

                }

            }
            else {

                for (j=0; j<this.width; j++) {

                    if (j == 0) {
                        table += '<tr>';
                    }

                    table += '<td blotter="abjs:' + i + ":" + j +'">' + this.cells[i][j].getFormattedValue(this) + '</td>';

                    if (j == this.width-1) {
                        table += '</tr>';
                        if (i == this.displayHeight-1) {
                            table += '</tbody>';
                        }
                    }                    

                }

            }

        }

        table += '</table>';

        debug.end("AdaptableGrid.render");
        
        debug.start("AdaptableGrid.html");
        $(this).html(table);
        debug.end("AdaptableGrid.html");
        
        this.applyStyles();
        this.editEvents();

        if (callback) {
            callback();
        }

    }

    /**
     * AdaptableGrid.applyStyles
     * Adds any styles necessary to cells
     * @returns {null}
     */
    this.applyStyles = function () {
        $(this).addClass('blotter-grid');
        $(this).find('.adaptablegrid-datepicker').each(function () {
            el = $(this);
            el.datepicker({
                showOn: "button",
                buttonImageOnly: true,
                buttonImage: "calendar.png",
                dateFormat: el.attr('blotter-format')
            });
        });
    }

    /**
     * AdaptableGrid.editEvents
     * When changing any DOM elements, update the cells property
     * @returns {void}
     */
    this.editEvents = function () {
        
        gridRef = this;
        
        // Sorting events
        $(this).find('.adaptablegrid-header').on('click', function () {
            columnIndex = $(this).attr('blotter').split("abjs:0:")[1];
            if ($(this).hasClass('adaptablegrid-sort-asc')) {
                c = 'adaptablegrid-sort-des';
            }
            else {
                c = 'adaptablegrid-sort-asc';
            }
            Sort.do(gridRef, gridRef.columns[columnIndex], (c == 'adaptablegrid-sort-asc'), function () {
                gridRef.findElement("0:" + columnIndex).addClass('adaptablegrid-sort').addClass(c);
            });
        });

        // Datepicker events
        $(this).find('.adaptablegrid-datepicker').on('change', function () {
            thisCell = $(this).parents('td[blotter]').attr('blotter').split("abjs:")[1].split(":");
            newValue = $(this).val();
            gridRef.cells[thisCell[0]][thisCell[1]].setValue(newValue);
        });
        
        // Boolean events
        $(this).find('.adaptablegrid-checkbox').on('change', function () {
            thisCell = $(this).parents('td[blotter]').attr('blotter').split("abjs:")[1].split(":");
            newValue = $(this).is(':checked') ? 1 : 0;
            gridRef.cells[thisCell[0]][thisCell[1]].setValue(newValue);
        });

    }

    /**
     * AdaptableGrid.findElement
     * Finds the HTML tag within the grid and returns the jQuery elements
     * @param {string} field - The Blotter reference to the cell
     * @returns {jQuery}
     */
    this.findElement = function (ref) {
        return $(this).find('[blotter="abjs:' + ref + '"]');
    }

    /**
     * AdaptableGrid.columnToIndexes
     * Convert all the cells in a particular column to a number
     * @param {integer} ind - The column index
     * @returns {void}
     */
    this.columnToIndexes = function (ind) {
        debug.start("AdaptableGrid.columnToIndexes");
        for (i=1; i<this.cells.length; i++) {
            indexOfValue = this.columnValueToIndex[ind][this.cells[i][ind].getValue()];
            this.cells[i][ind].setValue(indexOfValue);
        }
        debug.end("AdaptableGrid.columnToIndexes");
    }

    /**
     * AdaptableGrid.indexesToColumn
     * Convert all the cells in a particular column from a number back to their original value
     * @param {integer} ind - The column index
     * @returns {void}
     */
    this.indexesToColumn = function (ind) {
        debug.start("AdaptableGrid.indexesToColumn");
        for (i=1; i<this.cells.length; i++) {
            this.cells[i][ind].setValue(this.columnIndexToValue[ind][this.cells[i][ind].getValue()]);
        }
        debug.end("AdaptableGrid.indexesToColumn");
    }

    /**
     * AdaptableGrid.columnToIndexes
     * Generate two maps to turn text to an index and index back to text
     * @param {integer} columnIndex - The column index used for sorting
     * @returns {void}
     */
    this.getColumnIndexes = function (ind) {
        
        debug.start("AdaptableGrid.getColumnIndexes");
        
        if (this.columnIndexToValue[ind] == null) {

            this.columnIndexToValue[ind] = $.unique($.map(this.cells, function (i, n) {
                if (n > 0) {
                    return i[ind].getValue();
                }
            }));

            this.columnIndexToValue[ind].sort();

            var key;
            var tmpArr = {};

            for (i=0; i<this.columnIndexToValue[ind].length; i++) {
                tmpArr[this.columnIndexToValue[ind][i]] = i;
            }

            this.columnValueToIndex[ind] = tmpArr;

        }

        debug.end("AdaptableGrid.getColumnIndexes");

    }

    /**
     * AdaptableGrid.configureRowCol
     * After the cell
     * @param {string} column - The column reference to order by
     * @param {bool} asc - Set to true if column is ordered ascending
     * @returns {void}
     */
    this.configureRowCol = function () {
        debug.start("AdaptableGrid.configureRowCol");
        for (i=0; i<this.height; i++) {
            for (j=0; j<this.width; j++) {
                this.cells[i][j].row = i;
                this.cells[i][j].col = j;
            }
        }
        debug.end("AdaptableGrid.configureRowCol");
    }

    return this.__constructor(options);

}