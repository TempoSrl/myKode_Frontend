(function () {
    if (window.testGetPageOneTimeScript===undefined) {
        //console.log('testGetPageOneTimeScript is undefined');
        window.testGetPageOneTimeScript = 0;
    }
    //console.log('adding to testGetPageOneTimeScript');
    window.testGetPageOneTimeScript += 1;
})();