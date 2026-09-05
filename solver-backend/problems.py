problem = {
    "sense": "maximize",

    "variables": {
        "x1": {
            "type": "continuous",
            "lower": 0,
            "upper": 100
        },
        "x2": {
            "type": "continuous",
            "lower": 0,
            "upper": 100
        },
        "x3": {
            "type": "continuous",
            "lower": 0,
            "upper": 100
        },
        "x4": {
            "type": "continuous",
            "lower": 0,
            "upper": 100
        },
        "x5": {
            "type": "continuous",
            "lower": 0,
            "upper": 100
        }
    },

    "objective": {
        "x1": 10,
        "x2": 20,
        "x3": 15,
        "x4": 25,
        "x5": 30
    },

    "constraints": [
        {
            "x1": 1,
            "x2": 2,
            "x3": 1,
            "x4": 3,
            "x5": 2,
            "relation": "<=",
            "limit": 1000
        },
        {
            "x1": 1,
            "x2": 1,
            "x3": 1,
            "x4": 1,
            "x5": 1,
            "relation": "<=",
            "limit": 500
        },
        {
            "x1": 2,
            "x2": 1,
            "x3": 2,
            "x4": 1,
            "x5": 1,
            "relation": "<=",
            "limit": 620
        }
    ]
}