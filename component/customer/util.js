
 

export const NumberPattern = (num) =>{
    const numM = parseFloat(num).toFixed(2)
    const arr = numM.toString().split('.')
    const rtn = arr[0].toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
    return  (arr.length > 1)? rtn+'.'+arr[1]: rtn+'.00'
}

export const RemarkGenerator = (am,pm,type_amount) =>{
    let rtn = ''
    if (am < pm){
        rtn = 'PM '+type_amount+' is more than AM'
    }else if(am > pm){
        rtn = 'PM '+type_amount+' is less than AM'
    }else{
        rtn = 'PM '+type_amount+' is less equal AM'
    }
    return rtn
}

export const AverageCalc = (total,units) => {
    if(units === 0){
        return 0
    }else{
        return total/units
    }
}