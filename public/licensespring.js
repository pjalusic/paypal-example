/*
minimal data structure for successful order creation on PayPal should be:
 {
    purchase_units: [{
        reference_id: "myOrderReferenceId",
        amount: {
            value: "1.5",
            breakdown: {
                item_total: {
                    currency_code: "USD",
                    value: "1.5"
                }
            }
        },
        items: [{
                name: "My product name 1",
                quantity: 1,
                unit_amount: {
                    currency_code: "USD",
                    value: "1"
                }
            },
            {
                name: "My product name 2",
                quantity: 2,
                unit_amount: {
                    currency_code: "USD",
                    value: "0.25"
                }
            }
        ]
    }]
}
however, for successful integration with LicenseSpring, please use structure below.
note quantity changes and product duplication, as well as using sku attribute to transfer licensing data
 {
    purchase_units: [{
        reference_id: "myOrderReferenceId",
        amount: {
            value: "1.5",
            breakdown: {
                item_total: {
                    currency_code: "USD",
                    value: "1.5"
                }
            }
        },
        items: [{
                name: "My product name 1",
                quantity: 1,
                unit_amount: {
                    currency_code: "USD",
                    value: "1"
                },
                sku: "secret_data",

            },
            {
                name: "My product name 2",
                quantity: 1,
                unit_amount: {
                    currency_code: "USD",
                    value: "0.25"
                },
                sku: "secret_data",
            },
            {
                name: "My product name 2",
                quantity: 1,
                unit_amount: {
                    currency_code: "USD",
                    value: "0.25"
                },
                sku: "secret_data",
            }
        ]
    }]
}
 */

/*
 * create structure suitable for successful order creation on PayPal.
 * PayPal uses 2 decimal points.
 * TODO check if received data is in valid format
 */
function createOrderDataSctructure(orderReferenceId, responseText, currency) {
    let data = JSON.parse(responseText),
        items = [],
        i,
        sum = 0;
    // TODO if data.success
    JSON.parse(data.message).products.forEach(function (item) {
        for (i = 0; i < parseInt(item.quantity); i++) {

            items.push({
                name: item.name,
                quantity: 1,
                unit_amount: {
                    currency_code: currency,
                    value: item.price.toFixed(2)
                },
                sku: btoa(item.code + ";" + item.licenses[i])
            });
        }
        sum += parseFloat(item.price) * parseInt(item.quantity);
    });

    return {
        purchase_units: [{
            reference_id: orderReferenceId,
            amount: {
                value: sum.toFixed(2),
                breakdown: {
                    item_total: {
                        currency_code: currency,
                        value: sum.toFixed(2)
                    }
                }
            },
            items: items
        }]
    };
}

function addNewElementToParent(tag, parent, innerHTML = null, className = tag) {
    let classNamePrepend = "licensespring-",
        element = document.createElement(tag);

    element.classList.add(classNamePrepend + className);
    element.innerHTML = innerHTML;
    parent.appendChild(element);
    return element;
}

/*
 * display activated licenses.
 * currently it create a very basic popup.
 * currently sku attribute is used for storing license data, ";" is separator.
 * TODO check if received data is in valid format
 */
function showLicenseKeys(details) {
    let wrapper = addNewElementToParent("div", document.body, null, "wrapper"),
        container = addNewElementToParent("div", wrapper, null, "container"),
        closeButton = addNewElementToParent("a", container, "X", "close"),
        header = addNewElementToParent("h2", container, "Thank you for your purchase!"),
        para = addNewElementToParent("p", container, "Here are your licenses:"),
        table = addNewElementToParent("div", container, null, "table"),
        row = addNewElementToParent("div", table, null, "row"),
        span1 = addNewElementToParent("span", row, "Product", "product-name-header"),
        span2 = addNewElementToParent("span", row, "License", "product-name-header");

    // close popup with license keys
    document.addEventListener("click", function _listener(e) {
        if (["licensespring-wrapper", "licensespring-close"].includes(e.target.className)) {
            document.querySelectorAll(".licensespring-wrapper")[0].style.display = "none";
            document.removeEventListener("click", _listener);
        }
    });

    details.purchase_units[0].items.forEach(function (item) {
        // sku attribute is used, ";" is separator
        let item_name = item.name,
            license_key = atob(item.sku).split(";")[1];

        let license_row = addNewElementToParent("div", table, null, "row"),
            license_span1 = addNewElementToParent("span", license_row, item_name, "product-name"),
            license_span2 = addNewElementToParent("span", license_row, license_key, "product-license");
    });
}

/*
 * used for Integration with direct webhooks
 */
function registerLicenseKeys(url, details) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let response = JSON.parse(this.responseText);
            if (response.success) {
                showLicenseKeys(details);
            } else {
                alert(response.message);
            }
        }
    };
    xhttp.open("POST", url, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(details));
}