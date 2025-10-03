/**
 * API Features Utility
 * 
 
 * 
 * @module utils/apiFeatures
 */

class APIFeatures {
    /**
     * Constructor
     * 
     * @param {Object} query - Mongoose query object
     * @param {Object} queryString - Request query string
     */
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    /**
     * Filter query based on query parameters
     * Supports advanced filtering: ?field[gte]=value
     * 
     * @returns {APIFeatures} this
     */
    filter() {
        // Create a copy of query string
        const queryObj = { ...this.queryString };

        // Exclude special fields
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach((el) => delete queryObj[el]);

        // Advanced filtering (gte, gt, lte, lt)
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt|ne)\b/g, (match) => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }

    /**
     * Sort query results
     * Default sort: -createdAt (newest first)
     * Multiple sort: ?sort=price,-rating
     * 
     * @returns {APIFeatures} this
     */
    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            // Default sort by creation date (newest first)
            this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    /**
     * Limit fields in response
     * ?fields=name,email
     * ?fields=-password (exclude password)
     * 
     * @returns {APIFeatures} this
     */
    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            // Exclude __v by default
            this.query = this.query.select('-__v');
        }

        return this;
    }

    /**
     * Paginate results
     * ?page=2&limit=10
     * 
     * @returns {APIFeatures} this
     */
    paginate() {
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = parseInt(this.queryString.limit, 10) || 10;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }

    /**
     * Get pagination metadata
     * 
     * @param {number} totalDocuments - Total number of documents
     * @returns {Object} Pagination metadata
     */
    getPaginationMeta(totalDocuments) {
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = parseInt(this.queryString.limit, 10) || 10;
        const totalPages = Math.ceil(totalDocuments / limit);

        return {
            currentPage: page,
            totalPages,
            pageSize: limit,
            totalRecords: totalDocuments,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    }
}

module.exports = APIFeatures;
