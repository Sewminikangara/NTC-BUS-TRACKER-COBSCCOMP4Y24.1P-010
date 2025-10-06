class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach((el) => delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        return this;
    }

    search() {
        if (this.queryString.search) {
            const searchRegex = new RegExp(this.queryString.search, 'i');
            this.query = this.query.find({
                $or: [
                    { name: searchRegex },
                    { description: searchRegex },
                    { email: searchRegex },
                    { routeNumber: searchRegex },
                    { registrationNumber: searchRegex },
                    { tripNumber: searchRegex },
                ],
            });
        }
        return this;
    }

    populate(populateOptions) {
        if (populateOptions) {
            this.query = this.query.populate(populateOptions);
        }
        return this;
    }

    async countDocuments() {
        const totalDocs = await this.query.model.countDocuments(this.query.getFilter());
        return totalDocs;
    }

    getQuery() {
        return this.query;
    }

    getPaginationMeta(totalDocuments) {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const totalPages = Math.ceil(totalDocuments / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            page,
            limit,
            totalDocuments,
            totalPages,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null,
        };
    }
}

module.exports = APIFeatures;