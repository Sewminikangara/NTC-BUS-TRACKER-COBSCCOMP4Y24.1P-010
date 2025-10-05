/**

/**
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
        links.collection = {
            href: `${baseUrl}/${resourceType}`,
            method: 'GET',
        };
    } else {
        links.create = {
            href: `${baseUrl}/${resourceType}`,
            method: 'POST',
        };
    }

    if (options.page && options.totalPages) {
        const { page, totalPages } = options;

        if (page > 1) {
            links.first = {
                href: `${baseUrl}/${resourceType}?page=1`,
                method: 'GET',
            };
            links.prev = {
                href: `${baseUrl}/${resourceType}?page=${page - 1}`,
                method: 'GET',
            };
        }

        if (page < totalPages) {
            links.next = {
                href: `${baseUrl}/${resourceType}?page=${page + 1}`,
                method: 'GET',
            };
            links.last = {
                href: `${baseUrl}/${resourceType}?page=${totalPages}`,
                method: 'GET',
            };
        }
    }

    if (options.parentResource && options.parentId) {
        links.parent = {
            href: `${baseUrl}/${options.parentResource}/${options.parentId}`,
            method: 'GET',
        };
    }

    return links;
};

/**
const generateRelatedLinks = (baseUrl, resourceType, resource) => {
    const related = {};

    if (resourceType === 'routes' && resource._id) {
        related.buses = {
            href: `${baseUrl}/buses?routeId=${resource._id}`,
            method: 'GET',
        };
        related.trips = {
            href: `${baseUrl}/trips/route/${resource._id}`,
            method: 'GET',
        };
    }

    if (resourceType === 'buses' && resource._id) {
        if (resource.routeId) {
            related.route = {
                href: `${baseUrl}/routes/${resource.routeId}`,
                method: 'GET',
            };
        }
        if (resource.operatorId) {
            related.operator = {
                href: `${baseUrl}/operators/${resource.operatorId}`,
                method: 'GET',
            };
        }
        related.trips = {
            href: `${baseUrl}/trips/bus/${resource._id}`,
            method: 'GET',
        };
        related.location = {
            href: `${baseUrl}/locations/bus/${resource._id}/latest`,
            method: 'GET',
        };
    }

    if (resourceType === 'trips' && resource._id) {
        if (resource.routeId) {
            related.route = {
                href: `${baseUrl}/routes/${resource.routeId}`,
                method: 'GET',
            };
        }
        if (resource.busId) {
            related.bus = {
                href: `${baseUrl}/buses/${resource.busId}`,
                method: 'GET',
            };
        }
        related.locations = {
            href: `${baseUrl}/locations/trip/${resource._id}`,
            method: 'GET',
        };
    }

    if (resourceType === 'operators' && resource._id) {
        related.buses = {
            href: `${baseUrl}/buses/operator/${resource._id}`,
            method: 'GET',
        };
    }

    return Object.keys(related).length > 0 ? related : undefined;
};

/**
const addHATEOAS = (data, req, options = {}) => {
    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    const resourceType = req.baseUrl.split('/').pop();
    const resourceId = req.params.id;

    const links = generateLinks(baseUrl, resourceType, resourceId, options);

    const related = generateRelatedLinks(baseUrl, resourceType, data.data || data);

    const enhancedData = {
        ...data,
        _links: links,
    };

    if (related) {
        enhancedData._links.related = related;
    }

    return enhancedData;
};

module.exports = {
    generateLinks,
    generateRelatedLinks,
    addHATEOAS,
};

