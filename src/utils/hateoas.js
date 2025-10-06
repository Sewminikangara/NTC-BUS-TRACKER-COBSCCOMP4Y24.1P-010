const generateLinks = (baseUrl, resourceType, resourceId, options = {}) => {
    const links = {
        self: {
            href: `${baseUrl}/${resourceType}${resourceId ? `/${resourceId}` : ''}`,
            method: 'GET',
        },
    };

    if (resourceId) {
        links.update = {
            href: `${baseUrl}/${resourceType}/${resourceId}`,
            method: 'PUT',
        };
        links.delete = {
            href: `${baseUrl}/${resourceType}/${resourceId}`,
            method: 'DELETE',
        };
    } else {
        links.create = {
            href: `${baseUrl}/${resourceType}`,
            method: 'POST',
        };
    }

    if (options.collection) {
        links.collection = {
            href: `${baseUrl}/${resourceType}`,
            method: 'GET',
        };
    }

    return links;
};

const addHATEOASLinks = (data, baseUrl, resourceType, options = {}) => {
    if (Array.isArray(data)) {
        return data.map((item) => ({
            ...item.toObject ? item.toObject() : item,
            _links: generateLinks(baseUrl, resourceType, item._id, {
                collection: true,
                ...options,
            }),
        }));
    }

    if (data && typeof data === 'object') {
        return {
            ...data.toObject ? data.toObject() : data,
            _links: generateLinks(baseUrl, resourceType, data._id, options),
        };
    }

    return data;
};

const addRouteLinks = (route, baseUrl) => {
    const links = generateLinks(baseUrl, 'routes', route._id, {
        collection: true,
    });
    return {
        ...route.toObject ? route.toObject() : route,
        _links: links,
    };
};

const addBusLinks = (bus, baseUrl) => {
    const links = generateLinks(baseUrl, 'buses', bus._id, {
        collection: true,
    });
    return {
        ...bus.toObject ? bus.toObject() : bus,
        _links: links,
    };
};

const addTripLinks = (trip, baseUrl) => {
    const links = generateLinks(baseUrl, 'trips', trip._id, {
        collection: true,
    });
    return {
        ...trip.toObject ? trip.toObject() : trip,
        _links: links,
    };
};

const addOperatorLinks = (operator, baseUrl) => {
    const links = generateLinks(baseUrl, 'operators', operator._id, {
        collection: true,
    });
    return {
        ...operator.toObject ? operator.toObject() : operator,
        _links: links,
    };
};

const addLocationLinks = (location, baseUrl) => {
    const links = generateLinks(baseUrl, 'locations', location._id, {
        collection: true,
    });
    return {
        ...location.toObject ? location.toObject() : location,
        _links: links,
    };
};

const addUserLinks = (user, baseUrl) => {
    const links = generateLinks(baseUrl, 'users', user._id, {
        collection: true,
    });
    return {
        ...user.toObject ? user.toObject() : user,
        _links: links,
    };
};

const addPaginationLinks = (baseUrl, page, limit, totalPages, totalResults) => {
    const links = {
        self: {
            href: `${baseUrl}?page=${page}&limit=${limit}`,
            method: 'GET',
        },
        first: {
            href: `${baseUrl}?page=1&limit=${limit}`,
            method: 'GET',
        },
        last: {
            href: `${baseUrl}?page=${totalPages}&limit=${limit}`,
            method: 'GET',
        },
    };

    if (page > 1) {
        links.prev = {
            href: `${baseUrl}?page=${page - 1}&limit=${limit}`,
            method: 'GET',
        };
    }

    if (page < totalPages) {
        links.next = {
            href: `${baseUrl}?page=${page + 1}&limit=${limit}`,
            method: 'GET',
        };
    }

    return {
        _links: links,
        _meta: {
            page,
            limit,
            totalPages,
            totalResults,
        },
    };
};

module.exports = {
    generateLinks,
    addHATEOASLinks,
    addRouteLinks,
    addBusLinks,
    addTripLinks,
    addOperatorLinks,
    addLocationLinks,
    addUserLinks,
    addPaginationLinks,
};