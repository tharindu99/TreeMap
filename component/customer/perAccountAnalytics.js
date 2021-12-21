import { NumberPattern, RemarkGenerator } from "./util"
import * as d3 from 'd3'
import { useState } from "react"

const PerAccountAnalytics = ([accountID, array,str,exception,cusotmerID]) => {

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
        const tmpHighDR = d3.least(tmpDrRollUp,([,sum])=> sum)
        const tmpLowDR = d3.least(tmpDrRollUp,([,sum])=> -sum)
        
        return [
            {name: 'HighestCrType('+tmpHighCR[0]+','+NumberPattern(tmpHighCR[1])+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
            {name: 'LowestCrType('+tmpLowCR[0]+','+NumberPattern(tmpLowCR[1])+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
            {name: 'HighestDrType('+tmpHighDR[0]+','+NumberPattern(tmpHighDR[1])+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
            {name: 'LowestDrType('+tmpLowDR[0]+','+NumberPattern(tmpLowDR[1].toFixed(2))+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
            {name: 'Findings',label:{fontSize: 12,fontWeight: 'bold' }}
        ]
    }

    const AcctSpecificCalculations = (calcType,data) =>{
        
        if(calcType === 'HighestDepositYear'){
            const dataM = data.filter(d => d['IC4PRODRCRIND'] ===  'C')
            const Total = d3.sum(dataM, d => d.IC4PROTRANSAMOUNT)
            const tmpRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['year'])
            const tmpHighest= d3.least(tmpRollUp,([,sum])=> -sum)

            return [
                {name:'Year('+tmpHighest[0]+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
                {name:'YearTotCr('+NumberPattern(tmpHighest[1])+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
                {name:'Percentage('+((tmpHighest[1]*100)/Total).toFixed(2)+'%)',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},}
            
            ]
        }else if(calcType === 'LowestDepositYear'){
            const dataM = data.filter(d => d['IC4PRODRCRIND'] ===  'C')
            const Total = d3.sum(dataM, d => d.IC4PROTRANSAMOUNT)
            const tmpRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['year'])
            const tmpLowest = d3.least(tmpRollUp,([,sum])=> sum)
            return [
                {name:'Year('+tmpLowest[0]+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
                {name:'YearTotCr('+NumberPattern(tmpLowest[1])+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
                {name:'Percentage('+((tmpLowest[1]*100)/Total).toFixed(2)+'%)',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},}
            
            ]
        }else if(calcType === 'HighestWtdYear'){
            const dataM = data.filter(d => d['IC4PRODRCRIND'] ===  'D')
            const Total = d3.sum(dataM, d => d.IC4PROTRANSAMOUNT)
            const tmpRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['year'])
            const tmpHighest= d3.least(tmpRollUp,([,sum])=> -sum)
            return [
                {name:'Year('+tmpHighest[0]+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
                {name:'YearTotDr('+NumberPattern(tmpHighest[1])+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
                {name:'Percentage('+((tmpHighest[1]*100)/Total).toFixed(2)+'%)',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},}
            
            ]
        }else if(calcType === 'LowestWtdYear'){
            const dataM = data.filter(d => d['IC4PRODRCRIND'] ===  'D')
            const Total = d3.sum(dataM, d => d.IC4PROTRANSAMOUNT)
            const tmpRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['year'])
            const tmpLowest = d3.least(tmpRollUp,([,sum])=> sum)
            return [
                {name:'Year('+tmpLowest[0]+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
                {name:'YearTotDr('+NumberPattern(tmpLowest[1])+')',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
                {name:'Percentage('+((tmpLowest[1]*100)/Total).toFixed(2)+'%)',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},}
            
            ]
        }
    }

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
        //console.log(dataM)

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
                {name:'YearWithHighest'+AMPM+special_word, label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},
                    children:[
                        {name: 'Year('+highest[0]+')', label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
                        {name: 'YearTot'+CRDR+'('+NumberPattern(highest[1])+','+HighestNumberOfTransc+')', label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
                        {name:'Percentage('+((highest[1]*100)/MainTotal).toFixed(2)+'%)',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
                    ]
                },
                {name:'YearWithLowest'+AMPM+special_word, label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},
                    children:[
                        {name: 'Year('+lowest[0]+')', label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
                        {name: 'YearTot'+CRDR+'('+NumberPattern(lowest[1])+','+LowestNumberOfTransc+')', label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
                        {name:'Percentage('+((lowest[1]*100)/MainTotal).toFixed(2)+'%)',label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},},
                    ]
                },
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
                {name:'CrAverage('+NumberPattern(((AMcredit+PMcredit)/(amCreditVoucher+pmCreditVoucher)).toFixed(2))+')',
                label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},
                },
                {name:'DrAverage('+NumberPattern(((AMdebit+PMdebit)/(amDebitVoucher+pmDebitVoucher)).toFixed(2))+')',
                label:{fontSize: 12,fontWeight: 'bold' },lineStyle:{color:'#DC143C'},
                },
                {name:'HighestDepositYear',
                 label:{fontSize: 12},lineStyle:{color:'#DC143C'},
                // lineStyle:{color:'#DC143C'},
                 children: AcctSpecificCalculations('HighestDepositYear',array)
                },
                {name:'LowestDepositYear',
                 label:{fontSize: 12},lineStyle:{color:'#DC143C'},
                 children: AcctSpecificCalculations('LowestDepositYear',array)
                // lineStyle:{color:'#DC143C'},
                },
                {name:'HighestWtdYear',
                 label:{fontSize: 12},lineStyle:{color:'#DC143C'},
                 children: AcctSpecificCalculations('HighestWtdYear',array)
                // lineStyle:{color:'#DC143C'},
                },
                {name:'LowestWtdYear',
                 label:{fontSize: 12},lineStyle:{color:'#DC143C'},
                 children: AcctSpecificCalculations('LowestWtdYear',array)
                // lineStyle:{color:'#DC143C'},
                },
                {name:'TransType',
                 label:{fontSize: 12},lineStyle:{color:'#DC143C'},
                 children: TotalTransType(array)
                // lineStyle:{color:'#DC143C'},
                },
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

export default PerAccountAnalytics