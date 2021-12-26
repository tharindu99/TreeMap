import { NumberPattern, RemarkGenerator,AverageCalc } from "./util"
import * as d3 from 'd3'
import { useState } from "react"


const PerYearAnalytics = ([year, array,str,exception,cusotmerID,accountID]) => {

    let exceptionM = exception, strM = str

    if(accountID != 'ALL'){
        array = array.filter(d => d.IC4PROACCOUNTID === accountID)
        exceptionM = exception.filter(d => d.IC4PROACCOUNTID === accountID)
        strM = str.filter(d => d.IC4PROACCOUNTID === accountID)
    }

    let AMcredit = 0,AMdebit = 0.00,amCreditVoucher = 0,amDebitVoucher = 0,PMcredit = 0.00,PMdebit = 0.00,pmCreditVoucher = 0,pmDebitVoucher = 0


    array.forEach(e => {
        const IC4PROTRANSTIME = e.IC4PROTRANSTIME
        const amt = e.IC4PROTRANSAMOUNT
        const transType = e.IC4PRODRCRIND
        if(IC4PROTRANSTIME >= 0 && IC4PROTRANSTIME <= 1159){
            if(transType == 'C'){
                AMcredit += amt
                amCreditVoucher += 1
            }else{
                AMdebit += amt
                amDebitVoucher += 1
            }
            
        }
        if(IC4PROTRANSTIME >= 1200 && IC4PROTRANSTIME <= 2359){
            if(transType == 'C'){
                PMcredit += amt
                pmCreditVoucher += 1
            }else{
                PMdebit += amt
                pmDebitVoucher += 1
            }
        }
    });
    

const calcBtwHourOf = (array) => {
    array.forEach(e => {
        e.hour = (e.IC4PROTRANSTIME-(e.IC4PROTRANSTIME%100))/100
        e.hourlyGroup = e.hour+'-'+(e.hour+1)
    });
    
    const RollUpSum = d3.rollup(array, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT']).toFixed(2)), d => d.hourlyGroup)
    const RollUpCount = d3.rollup(array, v => v.length, d => d.hourlyGroup)
    const hourlyGrouped = Array.from(RollUpCount.keys())

    return hourlyGrouped.map(d => {
        return {
            name:'BtwHourOf('+d+')',
            label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},
            children:[{
                name:'('+NumberPattern(RollUpSum.get(d))+','+RollUpCount.get(d)+')',
                label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},
            }]
        }
    })
}

const TotalTransType = (data) =>{
    const dataCR = data.filter(d => d['IC4PRODRCRIND'] ===  'C')
    const tmpCrRollUp = d3.rollup(dataCR, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['IC4PROTRANSTYPE'])
    const tmpHighCR = d3.least(tmpCrRollUp,([,sum])=> -sum)
    const tmpLowCR = d3.least(tmpCrRollUp,([,sum])=> sum)

    const dataDR = data.filter(d => d['IC4PRODRCRIND'] ===  'D')
    const tmpDrRollUp = d3.rollup(dataDR, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['IC4PROTRANSTYPE'])
    const tmpHighDR = d3.least(tmpDrRollUp,([,sum])=> -sum)
    const tmpLowDR = d3.least(tmpDrRollUp,([,sum])=> sum)

    const rtnMe = (arr) =>{
        if(arr && arr.length > 0){
            return arr[0]+','+NumberPattern(arr[1].toFixed(2))
        }else{
            return 'None'
        }  
        
    }
    
    return [
        {name: 'HighestCrType('+rtnMe(tmpHighCR)+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
        {name: 'LowestCrType('+rtnMe(tmpLowCR)+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
        {name: 'HighestDrType('+rtnMe(tmpHighDR)+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
        {name: 'LowestDrType('+rtnMe(tmpLowDR)+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
    ]
}

// const AcctSpecificCalculations = (calcType,data) =>{
    
//     if(calcType === 'HighestDepositYear'){
//         const dataM = data.filter(d => d['IC4PRODRCRIND'] ===  'C')
//         const Total = d3.sum(dataM, d => d.IC4PROTRANSAMOUNT)
//         const tmpRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['year'])
//         const tmpHighest= d3.least(tmpRollUp,([,sum])=> -sum)

//         return [
//             {name:'Year('+tmpHighest[0]+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
//             {name:'YearTotCr('+NumberPattern(tmpHighest[1])+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
//             {name:'Percentage('+((tmpHighest[1]*100)/Total).toFixed(2)+'%)',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},}
        
//         ]
//     }else if(calcType === 'LowestDepositYear'){
//         const dataM = data.filter(d => d['IC4PRODRCRIND'] ===  'C')
//         const Total = d3.sum(dataM, d => d.IC4PROTRANSAMOUNT)
//         const tmpRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['year'])
//         const tmpLowest = d3.least(tmpRollUp,([,sum])=> sum)
//         return [
//             {name:'Year('+tmpLowest[0]+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
//             {name:'YearTotCr('+NumberPattern(tmpLowest[1])+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
//             {name:'Percentage('+((tmpLowest[1]*100)/Total).toFixed(2)+'%)',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},}
        
//         ]
//     }else if(calcType === 'HighestWtdYear'){
//         const dataM = data.filter(d => d['IC4PRODRCRIND'] ===  'D')
//         const Total = d3.sum(dataM, d => d.IC4PROTRANSAMOUNT)
//         const tmpRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['year'])
//         const tmpHighest= d3.least(tmpRollUp,([,sum])=> -sum)
//         return [
//             {name:'Year('+tmpHighest[0]+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
//             {name:'YearTotDr('+NumberPattern(tmpHighest[1])+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
//             {name:'Percentage('+((tmpHighest[1]*100)/Total).toFixed(2)+'%)',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},}
        
//         ]
//     }else if(calcType === 'LowestWtdYear'){
//         const dataM = data.filter(d => d['IC4PRODRCRIND'] ===  'D')
//         const Total = d3.sum(dataM, d => d.IC4PROTRANSAMOUNT)
//         const tmpRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['year'])
//         const tmpLowest = d3.least(tmpRollUp,([,sum])=> sum)
//         return [
//             {name:'Year('+tmpLowest[0]+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
//             {name:'YearTotDr('+NumberPattern(tmpLowest[1])+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
//             {name:'Percentage('+((tmpLowest[1]*100)/Total).toFixed(2)+'%)',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},}
        
//         ]
//     }
// }

const AmPmAnalysis = (data,AMPM,CRDR,MainTotal,accountID,year) => {

    let dataM,total,count,highest,lowest,special_word

    if(AMPM === 'Am')dataM = data.filter(d=> d['IC4PROTRANSTIME'] >= 0 && d['IC4PROTRANSTIME'] <= 1159)
    if(AMPM === 'Pm')dataM = data.filter(d=> d['IC4PROTRANSTIME'] >= 1200 && d['IC4PROTRANSTIME'] <= 2359)
    if(CRDR === 'Credit'){ dataM = dataM.filter(d => d.IC4PRODRCRIND === 'C'); special_word = 'Deposit'} 
    if(CRDR === 'Debit'){dataM = dataM.filter(d => d.IC4PRODRCRIND === 'D'); special_word = 'Wtd'}
    
    if(accountID != 'ALL')dataM = dataM.filter(d => d.IC4PROACCOUNTID === accountID)
    if(year != 'ALL')dataM = dataM.filter(d => d.IC4PROTRANSDATE.toString().substring(0,4) === year)
        
    
    total = d3.sum(dataM, d => d.IC4PROTRANSAMOUNT)
    count = dataM.length

    if(dataM.length>0){

        const groupByYear= d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['year'])
        highest = d3.least(groupByYear,([,sum])=> -sum)
        const HighestNumberOfTransc = d3.group(dataM, d=> d.year).get(highest[0]).length
        lowest = d3.least(groupByYear,([,sum])=> sum)
        const LowestNumberOfTransc = d3.group(dataM, d=> d.year).get(lowest[0]).length
        const CrRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['IC4PROTRANSTYPE'])
        const TransTypeHigh = d3.max(CrRollUp)
        const TransTypeLow = d3.min(CrRollUp)

        return [
            {name:AMPM+CRDR+'('+NumberPattern(total)+','+count+')', label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},
            children:calcBtwHourOf(dataM)
            },
            {name:AMPM+'Average('+NumberPattern((total/count).toFixed(2))+')', label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
            {name:'Percentage('+((total*100)/MainTotal).toFixed(2)+'%)',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
            {name:AMPM+'TransType', label:{fontSize: 12,fontWeight: 'bold' },
                children:[
                    {name:'Highest'+CRDR+'Type('+TransTypeHigh[0]+','+NumberPattern(TransTypeHigh[1])+')',
                    label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},
                    },
                    {name:'Lowest'+CRDR+'Type('+TransTypeLow[0]+','+NumberPattern(TransTypeLow[1])+')',
                    label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},
                    },
                    {name:'Findings',lineStyle:{color:'#DC143C'}}
                ]
            },
            {name:'Findings',lineStyle:{color:'#DC143C'},},
        ]
    }else{
        return []
    }
}

const Top10 = (CRDR) => {
    let dataFiltered

    if(CRDR === 'Credit')dataFiltered = array.filter(d => d.IC4PRODRCRIND === 'C').slice().sort((a,b)=>d3.ascending(a.IC4PROTRANSAMOUNT,b.IC4PROTRANSAMOUNT))
    if(CRDR === 'Debit')dataFiltered = array.filter(d => d.IC4PRODRCRIND === 'D').slice().sort((a,b)=>d3.ascending(a.IC4PROTRANSAMOUNT,b.IC4PROTRANSAMOUNT))   
    
    const dataFilteredTop10 = dataFiltered.slice(0,10)
    const total = d3.sum(dataFiltered, d => d.IC4PROTRANSAMOUNT)
    const Top10total = d3.sum(dataFilteredTop10, d => d.IC4PROTRANSAMOUNT)

    const AMTrans = dataFilteredTop10.filter(d=> d['IC4PROTRANSTIME'] >= 0 && d['IC4PROTRANSTIME'] <= 1159)
    const AMTransTotal = d3.sum(AMTrans, d => d.IC4PROTRANSAMOUNT)

    const PMTrans = dataFilteredTop10.filter(d=> d['IC4PROTRANSTIME'] >= 1200 && d['IC4PROTRANSTIME'] <= 2359)
    const PMTransTotal = d3.sum(PMTrans, d => d.IC4PROTRANSAMOUNT)

    const TransList = (transactions,top10total,AMPM) => {
        const percentage = (d3.sum(transactions, d => d.IC4PROTRANSAMOUNT)*100/top10total).toFixed(2)
        const findings = (AMPM ==='AM')? RemarkGenerator(percentage,100-percentage,''):RemarkGenerator(100-percentage,percentage,'')
        const tmp = transactions.map(d => {
            return {
                name:'('+d.IC4PROTRANSDATE+','+d.IC4PROTRANSTYPE+','+NumberPattern(d.IC4PROTRANSAMOUNT)+')',
                label:{fontSize: 12},lineStyle:{color:'#DC143C'},
            }
        })
        tmp.push({
            name:'Percentage('+percentage+'%)',
            label:{fontSize: 12},lineStyle:{color:'#DC143C'},
        })
        tmp.push({
            name:'Findings :'+findings,
            label:{fontSize: 12},lineStyle:{color:'#DC143C'},
        })
        return tmp
    }

    const rtn = {
        name:'Top 10 '+CRDR+' ('+NumberPattern(Top10total)+','+(AverageCalc(Top10total,total)*100).toFixed(2)+'%)', 
        label:{fontSize: 12},lineStyle:{color:'#DC143C'},
        children: []
    }

    if(AMTransTotal > 0){
        rtn.children.push(
            {name:'Am'+CRDR+' ('+NumberPattern(AMTransTotal)+','+AMTrans.length+')',label:{fontSize: 12},lineStyle:{color:'#DC143C'},
            children: TransList(AMTrans,Top10total,'AM')
            })
    }     
    if(PMTransTotal > 0){
        rtn.children.push({name:'Pm'+CRDR+' ('+NumberPattern(PMTransTotal)+','+PMTrans.length+')',label:{fontSize: 12},lineStyle:{color:'#DC143C'},
        children: TransList(PMTrans,Top10total,'PM')
        })
    }
    

    return rtn
    
}

const exceptionForCutomer = exceptionM.filter(d => d.IC4PROCUSTOMERID === cusotmerID)
const RiskGroupBy = Array.from(d3.group(exceptionForCutomer, d => d.IC4PRORATING), ([name,children]) => ({name,children}))

const StrForCutomer = strM.filter(d => d.IC4PROCUSTOMERID === cusotmerID)
const STRriskGroupBy = Array.from(d3.group(StrForCutomer, d => d.IC4PRORATING), ([name,children]) => ({name,children}))

const RiskStatus =(data,flag) => {
    const tmp = Array.from(d3.group(data, d => d.IC4PROSTATUS), ([name,children]) => ({name,children}))
    return tmp.map(d =>{
        return {
            name:'status : '+d.name+'('+d.children.length+')',
            label:{fontSize: 12,fontWeight: 'bold' },
            lineStyle: (flag === 'excep')? {color:'#32CD32'}:{color:'#FFE933'},
        }
    })
}

return [{
    name: 'Analytics',
    label:{fontSize: 12,fontWeight: 'bold' },
    children:[
        {name:'Total Credit('+NumberPattern(AMcredit+PMcredit)+' , '+(amCreditVoucher+pmCreditVoucher)+')',
         label:{fontSize: 12,fontWeight: 'bold'},
         lineStyle:{color:'#DC143C'},
         children: [
            {name:'AM('+NumberPattern(AMcredit)+','+amCreditVoucher+')', label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},
            children: AmPmAnalysis(array,'Am','Credit',(AMcredit+PMcredit),accountID,'ALL'), label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},
            },
            {name:'PM('+NumberPattern(PMcredit)+','+pmCreditVoucher+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},
            children: AmPmAnalysis(array,'Pm','Credit',(AMcredit+PMcredit),accountID,'ALL'), label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},
            },
            {name:'Remark('+RemarkGenerator(AMcredit,PMcredit,'Credit')+')', label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},}
         ]
        },
        {name:'Total Debit('+NumberPattern(AMdebit+PMdebit)+' , '+(amDebitVoucher+pmDebitVoucher)+')',
         label:{fontSize: 12,fontWeight: 'bold' },
         lineStyle:{color:'#DC143C'},
         children: [
            {name:'AM('+NumberPattern(AMdebit)+','+amDebitVoucher+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},
            children: AmPmAnalysis(array,'Am','Debit',(AMdebit+PMdebit),accountID,'ALL'), label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},
            },
            {name:'PM('+NumberPattern(PMdebit)+','+pmDebitVoucher+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},
            children: AmPmAnalysis(array,'Pm','Debit',(AMdebit+PMdebit),accountID,'ALL'), label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},
            },
            {name:'Remark('+RemarkGenerator(AMdebit,PMdebit,'Debit')+')', label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},lineStyle:{color:'#DC143C'},}
        ]
        },
        {name:'Descriptive',
         label:{fontSize: 12,fontWeight: 'bold' },
         lineStyle:{color:'#DC143C'},
         children:[
            {name:'Difference('+NumberPattern(Math.abs(AMcredit+PMcredit-AMdebit-PMdebit).toFixed(2))+' , '+Math.abs((amCreditVoucher+pmCreditVoucher)-(amDebitVoucher+pmDebitVoucher))+')',
             label:{fontSize: 12},lineStyle:{color:'#DC143C'},
            },
            {name:'CrAverage('+NumberPattern(AverageCalc((AMcredit+PMcredit),(amCreditVoucher+pmCreditVoucher)).toFixed(2))+')',
            label:{fontSize: 12 },lineStyle:{color:'#DC143C'},
            },
            {name:'DrAverage('+NumberPattern(AverageCalc((AMdebit+PMdebit),(amDebitVoucher+pmDebitVoucher)).toFixed(2))+')',
            label:{fontSize: 12 },lineStyle:{color:'#DC143C'},
            },
            {name:'TransType',
             label:{fontSize: 12},lineStyle:{color:'#DC143C'},
             children: TotalTransType(array)
            },
            Top10('Credit'),
            Top10('Debit'),
         ]
        },
        {name:'Exceptions',
        label:{fontSize: 12,fontWeight: 'bold' },
        lineStyle:{color:'#32CD32'},
        children: RiskGroupBy.map(d1 =>{
            return{
                name: 'Risk-'+d1.name+'('+d1.children.length+')',
                label:{fontSize: 12,fontWeight: 'bold' },
                lineStyle:{color:'#32CD32'},
                children: RiskStatus(d1.children,'excep')
            }
        })
        },
        {name:'STR',
        label:{fontSize: 12,fontWeight: 'bold' },
        lineStyle:{color:'#FFE933'},
        children: STRriskGroupBy.map(d2 =>{
            return{
                name: 'Risk-'+d2.name+'('+d2.children.length+')',
                label:{fontSize: 12,fontWeight: 'bold' },
                lineStyle:{color:'#FFE933'},
                children: RiskStatus(d2.children,'str')
            }
        })
        },
        {name:'Findings',
        label:{fontSize: 12,fontWeight: 'bold' },
        lineStyle:{color:'#337AFF'},
        children:[
            {name: 'Risk1',label:{fontSize: 12,fontWeight: 'bold' }},
            {name: 'Risk2',label:{fontSize: 12,fontWeight: 'bold' }},
            {name: 'Risk-n',label:{fontSize: 12,fontWeight: 'bold' }},
            {name: 'Findings : ',label:{fontSize: 12,fontWeight: 'bold' }}
        ]
        }
    ]
}]
}

export default PerYearAnalytics