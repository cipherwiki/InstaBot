let pathConfig = async () => {
    const fs = require('fs');
    const filePath='./';

    // cheack output directory is exist or not
    try {
        const stat = fs.statSync(`${filePath}output`);
    } catch (error) {
        // create directory 
        try {
            fs.mkdirSync(`${filePath}output`);
        } catch (error) {

        }
    }

    // cheack sessions directory is exist or not
    try {
        const stat = fs.statSync(`${filePath}sessions`);
    } catch (error) {
        // create directory
        try {
            fs.mkdirSync(`${filePath}sessions`);
        } catch (error) {

        }
    }
}

module.exports = { pathConfig };