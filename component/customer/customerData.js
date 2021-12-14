import TreeMap from "../treemap/treemap"
import { Spinner, Select } from '@chakra-ui/react'
import * as d3 from 'd3'
import { useState } from "react"


const CustomerData = ({cusotmer,exception,journal,srt}) => {

    const groupByCustomerID = d3.group(cusotmer, d => d['IC4PROCUSTOMERID'])
    const customerList = Array.from(groupByCustomerID.keys())

    const journalGroupByCustomer = d3.group(journal, d => d['IC4PROCUSTOMERID'])

    const NumberPattern = (num) =>{
        const numM = parseFloat(num).toFixed(2)
        const arr = numM.toString().split('.')
        const rtn = arr[0].toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
        return  (arr.length > 1)? rtn+'.'+arr[1]: rtn+'.00'
    }

    const RemarkGenerator = (am,pm,type_amount) =>{
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

    const AcctSpecificCalculations = (calcType,data) =>{
        if(calcType === 'HighestDepositAcct'){
            const dataM = data.filter(d => d['IC4PRODRCRIND'] ===  'C')
            const tmpRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['IC4PROACCOUNTID'])
            const tmpHighest= d3.least(tmpRollUp,([,sum])=> -sum)
            console.log(tmpHighest)
            return [
                {name:'Account('+tmpHighest[0]+')',label:{fontSize: 14,fontWeight: 'bold' }},
                {name:'AcctTotCr('+NumberPattern(tmpHighest[1])+')',label:{fontSize: 14,fontWeight: 'bold' }},
                {name:'Percentage'}
            
            ]
        }else if(calcType === 'LowestDepositAcct'){
            const dataM = data.filter(d => d['IC4PRODRCRIND'] ===  'C')
            const tmpRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['IC4PROACCOUNTID'])
            const tmpLowest = d3.least(tmpRollUp,([,sum])=> sum)
            return [
                {name:'Account('+tmpLowest[0]+')',label:{fontSize: 14,fontWeight: 'bold' }},
                {name:'AcctTotCr('+NumberPattern(tmpLowest[1])+')',label:{fontSize: 14,fontWeight: 'bold' }},
                {name:'Percentage'}
            
            ]
        }else if(calcType === 'HighestWtdAcct'){
            const dataM = data.filter(d => d['IC4PRODRCRIND'] ===  'D')
            const tmpRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['IC4PROACCOUNTID'])
            const tmpHighest= d3.least(tmpRollUp,([,sum])=> -sum)
            return [
                {name:'Account('+tmpHighest[0]+')',label:{fontSize: 14,fontWeight: 'bold' }},
                {name:'AcctTotDr('+NumberPattern(tmpHighest[1])+')',label:{fontSize: 14,fontWeight: 'bold' }},
                {name:'Percentage'}
            
            ]
        }else if(calcType === 'LowestWtdAcct'){
            const dataM = data.filter(d => d['IC4PRODRCRIND'] ===  'D')
            const tmpRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['IC4PROACCOUNTID'])
            const tmpLowest = d3.least(tmpRollUp,([,sum])=> sum)
            return [
                {name:'Account('+tmpLowest[0]+')',label:{fontSize: 14,fontWeight: 'bold' }},
                {name:'AcctTotDr('+NumberPattern(tmpLowest[1])+')',label:{fontSize: 14,fontWeight: 'bold' }},
                {name:'Percentage'}
            
            ]
        }
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
            {name: 'HighestCrType('+tmpHighCR[0]+','+NumberPattern(tmpHighCR[1])+')',label:{fontSize: 14,fontWeight: 'bold' }},
            {name: 'LowestCrType('+tmpLowCR[0]+','+NumberPattern(tmpLowCR[1])+')',label:{fontSize: 14,fontWeight: 'bold' }},
            {name: 'HighestDrType('+tmpHighDR[0]+','+NumberPattern(tmpHighDR[1])+')',label:{fontSize: 14,fontWeight: 'bold' }},
            {name: 'LowestDrType('+tmpLowDR[0]+','+NumberPattern(tmpLowDR[1].toFixed(2))+')',label:{fontSize: 14,fontWeight: 'bold' }},
            {name: 'Findings',label:{fontSize: 14,fontWeight: 'bold' }}
        ]
    }

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
                label:{fontSize: 14,fontWeight: 'bold' },
                children:[{
                    name:'('+NumberPattern(RollUpSum.get(d))+','+RollUpCount.get(d)+')',
                    label:{fontSize: 14,fontWeight: 'bold' }
                }]
            }
        })
    }

    const AmPmAnalysis = (data,AMPM,CRDR) => {

        let dataM,total,count,highest,lowest,special_word
        if(AMPM === 'Am')dataM = data.filter(d=> d['IC4PROTRANSTIME'] >= 0 && d['IC4PROTRANSTIME'] <= 1159)
        if(AMPM === 'Pm')dataM = data.filter(d=> d['IC4PROTRANSTIME'] >= 1200 && d['IC4PROTRANSTIME'] <= 2359)
        if(CRDR === 'Credit'){ dataM = dataM.filter(d => d.IC4PRODRCRIND === 'C'); special_word = 'Deposit'} 
        if(CRDR === 'Debit'){dataM = dataM.filter(d => d.IC4PRODRCRIND === 'D'); special_word = 'Wtd'}

        total = d3.sum(dataM, d => d.IC4PROTRANSAMOUNT)
        count = dataM.length
        const groupByAcc= d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['IC4PROACCOUNTID'])
        highest = d3.least(groupByAcc,([,sum])=> -sum)
        const HighestNumberOfTransc = d3.group(dataM, d=> d.IC4PROACCOUNTID).get(highest[0]).length
        lowest = d3.least(groupByAcc,([,sum])=> sum)
        const LowestNumberOfTransc = d3.group(dataM, d=> d.IC4PROACCOUNTID).get(lowest[0]).length

        const CrRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROTRANSAMOUNT'])), d => d['IC4PROTRANSTYPE'])
        const TransTypeHigh = d3.max(CrRollUp)
        const TransTypeLow = d3.min(CrRollUp)



        return [
            {name:AMPM+CRDR+'('+NumberPattern(total)+','+count+')', label:{fontSize: 14,fontWeight: 'bold'},
            children:calcBtwHourOf(dataM)
            },
            {name:AMPM+'Average('+NumberPattern((total/count).toFixed(2))+')', label:{fontSize: 14,fontWeight: 'bold'}},
            {name:'Percentage'},
            {name:'AcctWithHighest'+AMPM+special_word, label:{fontSize: 14,fontWeight: 'bold'},
                children:[
                    {name: 'Account('+highest[0]+')', label:{fontSize: 14,fontWeight: 'bold'}},
                    {name: 'AcctTot'+CRDR+'('+NumberPattern(highest[1])+','+HighestNumberOfTransc+')', label:{fontSize: 14,fontWeight: 'bold'}}
                ]
            },
            {name:'AcctWithLowest'+AMPM+special_word, label:{fontSize: 14,fontWeight: 'bold'},
                children:[
                    {name: 'Account('+lowest[0]+')', label:{fontSize: 14,fontWeight: 'bold'}},
                    {name: 'AcctTot'+CRDR+'('+NumberPattern(lowest[1])+','+LowestNumberOfTransc+')', label:{fontSize: 14,fontWeight: 'bold'}}
                ]
            },
            {name:AMPM+'TransType', label:{fontSize: 14,fontWeight: 'bold'},
                children:[
                    {name:'Highest'+CRDR+'Type('+TransTypeHigh[0]+','+NumberPattern(TransTypeHigh[1])+')',
                     label:{fontSize: 14,fontWeight: 'bold'}
                    },
                    {name:'Lowest'+CRDR+'Type('+TransTypeLow[0]+','+NumberPattern(TransTypeLow[1])+')',
                     label:{fontSize: 14,fontWeight: 'bold'}
                    },
                    {name:'Findings'},
                ]
            },
            {name:'Findings'},
        ]
    }


    
    const [cusotmerID, SetCustomerID] = useState(customerList[0])

    const TreeGenerator = (array,parameter) => {
        const child_arr =  Array.from(d3.group(array, d => d[parameter]), ([name,children]) => ({name,children}))
        return child_arr
    }

    

    const cutomerToAccount = (cusotmerId) => {
        const transactions = journalGroupByCustomer.get(cusotmerId)
        const accountgroup = Array.from(d3.group(transactions, d => d['IC4PROACCOUNTID'] ), ([name,children]) => ({name,children}))

        return accountgroup.map(d => {
            return {
                name: d.name,
                data: d.children
            }
        })
    }

    const YearlyGroupBy = (array) => {
        array.forEach(e => {
            e.year = parseInt(e['IC4PROTRANSDATE'].toString().substring(0,4))
            e.month = parseInt(e['IC4PROTRANSDATE'].toString().substring(4,6))
            e.quater = Math.ceil((e.month)/3)
        });

        return {yearly:TreeGenerator(array,'year'), monthly:TreeGenerator(array,'month'), quaterly:TreeGenerator(array,'quater')}
    }

    const TotalAnalyticsGenerator = (array) => {

        console.log(array)
        
        let AMcredit = 0,
        AMdebit = 0.00,
        amCreditVoucher = 0,
        amDebitVoucher = 0,
        PMcredit = 0.00,
        PMdebit = 0.00,
        pmCreditVoucher = 0,
        pmDebitVoucher = 0
        
        array.forEach(e => {
            const IC4PROTRANSTIME = e.IC4PROTRANSTIME
            const amt = e.IC4PROTRANSAMOUNT
            const transType = e.IC4PRODRCRIND
            if(IC4PROTRANSTIME >= 0 && IC4PROTRANSTIME <= 1159){
                if(transType === 'C'){
                    AMcredit += amt
                    amCreditVoucher += 1
                }else{
                    AMdebit += amt
                    amDebitVoucher += 1
                }
                
            }
            if(IC4PROTRANSTIME >= 1200 && IC4PROTRANSTIME <= 2359){
                if(transType === 'D'){
                    PMcredit += amt
                    pmCreditVoucher += 1
                }else{
                    PMdebit += amt
                    pmDebitVoucher += 1
                }
            }
        });

        AMdebit = parseFloat(AMdebit.toFixed(2))
        AMcredit = parseFloat(AMcredit.toFixed(2))
        PMdebit = parseFloat(PMdebit.toFixed(2))
        PMcredit = parseFloat(PMcredit.toFixed(2))

        
        
        const analytics_child = {
            name: 'Analytics' , 
            label:{fontSize: 14,fontWeight: 'bold'},
            children:[
                {name:'Total Credit('+NumberPattern(AMcredit+PMcredit)+' , '+(amCreditVoucher+pmCreditVoucher)+')',
                 label:{fontSize: 14,fontWeight: 'bold'},
                 lineStyle:{color:'#DC143C'},
                children: [
                    {name:'AM('+NumberPattern(AMcredit)+','+amCreditVoucher+')', label:{fontSize: 14,fontWeight: 'bold'},
                    children: AmPmAnalysis(array,'Am','Credit'), label:{fontSize: 14,fontWeight: 'bold' }
                    },
                    {name:'PM('+NumberPattern(PMcredit)+','+pmCreditVoucher+')',label:{fontSize: 14,fontWeight: 'bold'},
                    children: AmPmAnalysis(array,'Pm','Credit'), label:{fontSize: 14,fontWeight: 'bold' }
                    },
                    {name:'Remark('+RemarkGenerator(AMcredit,PMcredit,'Credit')+')', label:{fontSize: 14,fontWeight: 'bold'},lineStyle:{color:'#DC143C'},}
                ]
                },
                {name:'Total Debit('+NumberPattern(AMdebit+PMdebit)+' , '+(amDebitVoucher+pmDebitVoucher)+')',
                 label:{fontSize: 14,fontWeight: 'bold' },
                 lineStyle:{color:'#DC143C'},
                children: [
                    {name:'AM('+NumberPattern(AMdebit)+','+amDebitVoucher+')',label:{fontSize: 14,fontWeight: 'bold'},
                    children: AmPmAnalysis(array,'Am','Debit'), label:{fontSize: 14,fontWeight: 'bold' }
                    },
                    {name:'PM('+NumberPattern(PMdebit)+','+pmDebitVoucher+')',label:{fontSize: 14,fontWeight: 'bold'},
                    children: AmPmAnalysis(array,'Pm','Debit'), label:{fontSize: 14,fontWeight: 'bold' }
                    },
                    {name:'Remark('+RemarkGenerator(AMdebit,PMdebit,'Debit')+')', label:{fontSize: 14,fontWeight: 'bold'},lineStyle:{color:'#DC143C'}}
                ]
                },
                {name:'Statistics',
                 label:{fontSize: 14,fontWeight: 'bold' },
                 lineStyle:{color:'#DC143C'},
                 children:[
                    {name:'Difference('+NumberPattern((AMcredit+PMcredit-AMdebit-PMdebit).toFixed(2))+' , '+Math.abs((amCreditVoucher+pmCreditVoucher)-(amDebitVoucher+pmDebitVoucher))+')',
                     label:{fontSize: 14},
                    },
                    {name:'CrAverage('+NumberPattern(((AMcredit+PMcredit)/(amCreditVoucher+pmCreditVoucher)).toFixed(2))+')',
                    label:{fontSize: 14,fontWeight: 'bold'},
                    },
                    {name:'DrAverage('+NumberPattern(((AMdebit+PMdebit)/(amDebitVoucher+pmDebitVoucher)).toFixed(2))+')',
                    label:{fontSize: 14,fontWeight: 'bold'},
                    },
                    {name:'HighestDepositAcct',
                     label:{fontSize: 14},
                    // lineStyle:{color:'#DC143C'},
                     children: AcctSpecificCalculations('HighestDepositAcct',array)
                    },
                    {name:'LowestDepositAcct',
                     label:{fontSize: 14},
                     children: AcctSpecificCalculations('LowestDepositAcct',array)
                    // lineStyle:{color:'#DC143C'},
                    },
                    {name:'HighestWtdAcct',
                     label:{fontSize: 14},
                     children: AcctSpecificCalculations('HighestWtdAcct',array)
                    // lineStyle:{color:'#DC143C'},
                    },
                    {name:'LowestWtdAcct',
                     label:{fontSize: 14},
                     children: AcctSpecificCalculations('LowestWtdAcct',array)
                    // lineStyle:{color:'#DC143C'},
                    },
                    {name:'TransType',
                     label:{fontSize: 14},
                     children: TotalTransType(array)
                    // lineStyle:{color:'#DC143C'},
                    },
                 ]
                },
                // {name:'Exceptions',
                // label:{fontSize: 14,fontWeight: 'bold' },
                // lineStyle:{color:'#32CD32'},
                // children:[
                //     {name: 'Risk1',label:{fontSize: 14,fontWeight: 'bold' }},
                //     {name: 'Risk2',label:{fontSize: 14,fontWeight: 'bold' }},
                //     {name: 'Risk-n',label:{fontSize: 14,fontWeight: 'bold' }},
                //     {name: 'Findings : ',label:{fontSize: 14,fontWeight: 'bold' }}
                // ]
                
                // },
                // {name:'STR',
                // label:{fontSize: 14,fontWeight: 'bold' },
                // lineStyle:{color:'#FFE933'},
                // children:[
                //     {name: 'Risk1',label:{fontSize: 14,fontWeight: 'bold' }},
                //     {name: 'Risk2',label:{fontSize: 14,fontWeight: 'bold' }},
                //     {name: 'Risk-n',label:{fontSize: 14,fontWeight: 'bold' }},
                //     {name: 'Findings : ',label:{fontSize: 14,fontWeight: 'bold' }}
                // ]
                // },
                // {name:'Findings',
                // label:{fontSize: 14,fontWeight: 'bold' },
                // lineStyle:{color:'#337AFF'},
                // children:[
                //     {name: 'Risk1',label:{fontSize: 14,fontWeight: 'bold' }},
                //     {name: 'Risk2',label:{fontSize: 14,fontWeight: 'bold' }},
                //     {name: 'Risk-n',label:{fontSize: 14,fontWeight: 'bold' }},
                //     {name: 'Findings : ',label:{fontSize: 14,fontWeight: 'bold' }}
                // ]
                // }
            
                
            ]
        }

        //console.log(amVoucher)

        return analytics_child

    }
    
    const treeData = {name:cusotmerID,label:{fontSize: 14,fontWeight: 'bold'},
        children: cutomerToAccount(cusotmerID).map(d1 =>{
            const calc = YearlyGroupBy(d1.data)
            return {
                name:d1.name,
                label:{fontSize: 14,fontWeight: 'bold'},
                children: calc.yearly.map(d2 => {
                    return{
                        name: d2.name,
                        children:[
                            {name:'Monthly'},
                            {name:'Quartelly'}
                        ]
                    }
                })
            }
        }).concat(TotalAnalyticsGenerator(journalGroupByCustomer.get(cusotmerID)))

    }

    const CustomerSelection = (e) =>{
        SetCustomerID(e.target.value)
    }

    return(
        <div>
            CustommerId: 
            <Select size='sm' width={'200px'} onChange={CustomerSelection}>
                {customerList.map(d =>{
                    return (
                        <option value={d}>{d}</option>
                    )
                })}
            </Select>
            {treeData? <TreeMap data={treeData} /> : <Spinner />}
        </div>
    )
}

export default CustomerData