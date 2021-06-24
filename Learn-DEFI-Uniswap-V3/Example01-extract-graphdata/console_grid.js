var ConsoleGrid = require("console-grid");
var grid = new ConsoleGrid();
var data = {
    option: {
        sortField: "name"
    },
    columns: [{
        id: "name",
        name: "Name",
        type: "string",
        maxWidth: 38
    }, {
        id: "value",
        name: "Value",
        type: "string",
        maxWidth: 7,
        formatter: (v, row, column) => {
            return v;
        }
    }],
    rows: [{
        name: "Row 1",
        value: "1"
    }, {
        name: "Row 2",
        value: "2",
        subs: [{
            name: "Sub Row 1",
            value: "s1"
        }, {
            name: "Sub Row 2",
            value: "s2"
        }]
    }]
};
//returns lines could be saved to log file
var lines = grid.render(data);
