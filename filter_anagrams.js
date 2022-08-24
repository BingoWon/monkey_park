function aclean(arr) {
  let result = [];

  const mappingSheet = arr.reduce( (mappingSheet, str) => {
    return mappingSheet.set(str, strToMap(str.toUpperCase()));
  }, new Map() );

  // console.log(mappingSheet);

  while ( arr.length > 0 ) {
    let selectedArr = [];
    // for ( let str of arr ) {
    arr.slice().forEach( (newStr, index) => {
        // console.log(`${newStr}|||||| ${selectedArr} |||||${((index === 0) || (shouldSelect(selectedArr, newStr, mappingSheet)))}`)
        if ((index === 0) || (shouldSelect(selectedArr, newStr, mappingSheet))) {
        // 当应该添加到被选择的数组中时，别忘记从原数组中删掉。
        selectedArr.push(newStr);
        arr.splice(arr.indexOf(newStr), 1);
        // console.log(`${selectedArr}||||||${arr}`)
      }
    });
    result.push(selectedArr);
  }
  return result;
}



// 把字符串转换成map，key为字母，value为字母出现的次数。
function strToMap(str) {
  return str.split('').reduce( (resultMap, char) => {
    let charNum = resultMap.get(char);
    return (resultMap.set(char, charNum ? ++charNum : 1));
  }, new Map());
}

function checkSameMap(mapA, mapB) {
  if (mapA.size !== mapB.size) return false;

  for ( let entry of mapA ) {
    const [key, value] = entry;
    // let value = entry[1];
    // if ( !mapB.has(key) ) return false;
    // console.log(`${mapB.get(key)},,,${value}`);
    if ( mapB.get(key) !== value ) return false;
  };

  return true;
}

function shouldSelect(selectedArr, newStr, mappingSheet) {
  for (let selectedStr of selectedArr) {
    // console.log(strToMap(selectedStr.toUpperCase()));
    // console.log(strToMap(newStr.toUpperCase()));
    // console.log(checkSameMap(strToMap(selectedStr.toUpperCase()), strToMap(newStr.toUpperCase())));
    // console.log(mappingSheet);
    if ( checkSameMap(mappingSheet.get(selectedStr), mappingSheet.get(newStr)) ) return false;
  };
  return true;
}

// console.log("start");
// const a = strToMap('nap');
// const b = strToMap('nap');
// console.log(checkSameMap(a, b));
// let c = new Map([[a, '12312']]);
// console.log(c.get(b));
// console.log( shouldSelect(['nap'], 'teachers') );


let arr = ["nap", "teachers", "cheaters", "PAN", "ear", "era", "hectares"];

console.log( aclean(arr) ); // "nap,teachers,ear" or "PAN,cheaters,era"