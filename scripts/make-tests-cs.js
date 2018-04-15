'use-strict';

function upFirst(str)
{
    return str.substr(0, 1).toUpperCase() + str.substr(1);
}

function convert(src)
{
    var pattern = /(.*) == (.*)/;

    var match = pattern.exec(src);
    
    if(match) {
        var expression = match[1];
        var expectation = match[2];
        expression = expression.replace(']', ' }');
        expression = expression.replace('[', 'new byte[] { ');
        expression = upFirst(expression);
        var result = `Assert.Equal(${expectation}, CSLUtility.${expression});`;
        return result;
    }
    else
        throw new Error('src not match!');
}

function convert_test()
{
    var src = 'toIntLE([1,2,3], 0, 3) == 0x030201';
    var dst = 'Assert.Equal(0x030201, CSLUtility.ToIntLE(new byte[] { 1,2,3 }, 0, 3));';
    
    console.log('src: ' + src);
    console.log('dst: ' + dst);
    
    try {
        var res = convert(src);
        console.log('res: ' + res);
        if(res == dst)
            console.log('OK!');
        else
            console.error('result and dst are not same!');
    }
    catch(e)
    {
        console.error(e.Message);
    }
}

//convert_test();

const fs = require('fs');

function readFileAsString(filePath) {
    var buf = fs.readFileSync(filePath);
    var str = buf.toString();
    return str;
}

function load(src)
{
    var results = [];
    var fileContent = readFileAsString(src);

    const classPattern = /^# (.*)/;
    var classMatch = fileContent.match(classPattern);
    if(classMatch == null)
        throw new Error('class name not found');
    const className = classMatch[1];
    results.push(`\
using System;\r\n\
using Xunit;\r\n\
using Net.Erabbit.CSL;\r\n\
\r\n\
namespace CSL.Tests\r\n\
{\r\n\
    public class ${className}_Test\r\n\
    {`);

    const funcPattern  = /### (.*) - /;
    var funcs = fileContent.match(new RegExp(funcPattern, 'g'));
    if(funcs == null)
        throw new Error('func not founed');
    for(var func of funcs)
    {
        var funcMatch = func.match(funcPattern);
        if(funcMatch) {
            var funcName = funcMatch[1];
            //console.log('func: ' + funcName);
            var testPattern = new RegExp('\s*' + funcName + '\((.*)\) == (.*)');
            var tests = fileContent.match(new RegExp(testPattern, 'g'));
            if(tests)
            {
                results.push('\t\t[Fact]');
                results.push(`\t\tpublic void ${upFirst(funcName)}_Test()`);
                results.push('\t\t{');
                for(var test of tests)
                {
                    //console.log('src: ' + test);
                    var testAssert = convert(test);
                    results.push('\t\t\t' + testAssert);
                }
                results.push('\t\t}\r\n');
            }
        }
    }

    results.push('\
    }\r\n\
}\r\n'
    );

    results = results.join('\r\n');
    results = results.replace(/\t/g, '    ');

    fs.writeFileSync('csl-cs\\CSL.Tests\\' + className + '_Test.cs', results);
    return results;
}

var res = load('utility.md');
console.log(res);