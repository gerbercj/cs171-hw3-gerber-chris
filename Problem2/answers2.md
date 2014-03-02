# 1. Look at the data given in the Wiki table. Describe the data types. What is different from the datasets you've used before?

There are two data types in this table that we are working with: years and counts. The years are ordinal data, and the counts are ratio (quantitative) data. This is different than our Github data, which was primarily nominal data.

# 2. Take a look at the DOM tree for the Wikipedia table. Formulate in jQuery selector syntax the selection that would give you the DOM element for the second row in the Wikipedia table. Write down in selection syntax how you would get all table rows that are not the header row.

You could select just the second row with `$("table.wikitable tr:eq(1)")`. To change this to get all rows but the header row, you could use `$("table.wikitable tr:gt(0)")`.
