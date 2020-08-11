class CypherService {
    constructor(agensDatabaseHelper) {
        this._agensDatabaseHelper = agensDatabaseHelper;
    }

    async executeCypher(query) {
        let agensDatabaseHelper = this._agensDatabaseHelper;
        let result = {
            message: '',
            status: 200,
            data: null,
        };

        if (!query) {
            result.message = 'Query is not valid';
            result.status = 400;
            result.data = { cmd: query };
        } else {
            if (await agensDatabaseHelper.isHealth()) {
                result.message = 'Query is not valid';
                result.status = 200;
                result.data = await this.getExecuteResult(query);
            } else {
                result.message = 'ConnectionInfo is not valid';
                result.data = agensDatabaseHelper.toConnectionInfo();
                result.status = 500;
            }
        }

        return result;
    }

    async getExecuteResult(query) {
        let agensDatabaseHelper = this._agensDatabaseHelper;
        try {
            let queryResult = await agensDatabaseHelper.execute(query);
            let rows = queryResult.rows,
                columns = queryResult.fields.map((field) => field.name);

            let convertedRows = rows.map((row) => {
                let convetedObject = {};
                for (let k in row) {
                    if (row[k].hasOwnProperty('start')) {
                        convetedObject[k] = this.convertEdge(row[k]);
                    } else if (row[k].hasOwnProperty('id')) {
                        convetedObject[k] = this.convertVertex(row[k]);
                    } else {
                        convetedObject[k] = row[k];
                    }
                }
                return convetedObject;
            });

            return {
                rows: convertedRows,
                columns: columns,
            };
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    convertEdge({ label, id, start, end, props }) {
        return {
            label: label,
            id: `${id.oid}.${id.id}`,
            start: `${start.oid}.${start.id}`,
            end: `${end.oid}.${end.id}`,
            properties: props,
        };
    }

    convertVertex({ label, id, props }) {
        return {
            label: label,
            id: `${id.oid}.${id.id}`,
            properties: props,
        };
    }
}

module.exports = CypherService;
