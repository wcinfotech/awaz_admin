export const filterEventPostTimelimeData = (data, fields) => {
    return data.map(item => {
        let filteredItem = {};
        fields.map(field => {
            if (item.hasOwnProperty(field)) {
                filteredItem[field] = item[field];
            }
        });
        return filteredItem;
    });
}
