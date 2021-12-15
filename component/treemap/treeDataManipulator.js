import React, { useEffect, useState } from "react"
import ReactEcharts from "echarts-for-react"
import * as d3 from 'd3'
import TreeMap from "./treemap"
import { Spinner } from '@chakra-ui/react'

const TreeDataManipulator = ({data}) => {

    const [treeData, SetTreeData] = useState()

    const TreeGenerator = (groupBy,array,parameter) => {
        const child_arr =  Array.from(d3.group(array, d => d[parameter]), ([name,children]) => ({name,children}))
        return child_arr
    }

    const NumberPattern = (num) =>{
        return num.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")+'.00'
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

    const AnalyticsGenerator = (array) => {
        
        let AMcredit = 0.00,
        AMdebit = 0.00,
        amCreditVoucher = 0,
        amDebitVoucher = 0,
        PMcredit = 0.00,
        PMdebit = 0.00,
        pmCreditVoucher = 0,
        pmDebitVoucher = 0
        
        array.forEach(e => {
            const IC4PROENTRYTIME = parseFloat(e.IC4PROENTRYTIME)
            const amt = parseFloat(e.IC4PROLCYAMOUNT)
            if(IC4PROENTRYTIME >= 0 && IC4PROENTRYTIME <= 1159){
                if(amt >= 0){
                    AMcredit += amt
                    amCreditVoucher += 1
                }else{
                    AMdebit += amt
                    amDebitVoucher += 1
                }
                
            }
            if(IC4PROENTRYTIME >= 1200 && IC4PROENTRYTIME <= 2359){
                if(amt >= 0){
                    PMcredit += amt
                    pmCreditVoucher += 1
                }else{
                    PMdebit += amt
                    pmDebitVoucher += 1
                }
            }
            
        });
        
        const analytics_child = {
            name: 'Analytics' , 
            label:{fontSize: 14,fontWeight: 'bold'},
            children:[
                {name:'Credit('+NumberPattern(AMcredit+PMcredit)+' , '+(amCreditVoucher+pmCreditVoucher)+')',
                 label:{fontSize: 14,fontWeight: 'bold'},
                 lineStyle:{color:'#DC143C'},
                children: [
                    {name:'AM('+NumberPattern(AMcredit)+','+amCreditVoucher+')', label:{fontSize: 14,fontWeight: 'bold'}},
                    {name:'PM('+NumberPattern(PMcredit)+','+pmCreditVoucher+')',label:{fontSize: 14,fontWeight: 'bold'}},
                    {name:'Remark('+RemarkGenerator(AMcredit,PMcredit,'Credit')+')', label:{fontSize: 14,fontWeight: 'bold'},lineStyle:{color:'#DC143C'},}
                ]
                },
                {name:'Debit('+NumberPattern(AMdebit+PMdebit)+' , '+(amDebitVoucher+pmDebitVoucher)+')',
                 label:{fontSize: 14,fontWeight: 'bold' },
                 lineStyle:{color:'#DC143C'},
                children: [
                    {name:'AM('+NumberPattern(AMdebit)+','+amDebitVoucher+')',label:{fontSize: 14,fontWeight: 'bold'}},
                    {name:'PM('+NumberPattern(PMdebit)+','+pmDebitVoucher+')',label:{fontSize: 14,fontWeight: 'bold'}},
                    {name:'Remark('+RemarkGenerator(AMdebit,PMdebit,'Debit')+')', label:{fontSize: 14,fontWeight: 'bold'},lineStyle:{color:'#DC143C'}}
                ]
                },
                {name:'Diff('+NumberPattern(AMcredit+PMcredit+AMdebit+PMdebit)+' , '+Math.abs((amCreditVoucher+pmCreditVoucher)-(amDebitVoucher+pmDebitVoucher))+')',
                    label:{fontSize: 14,fontWeight: 'bold'},
                    lineStyle:{color:'#DC143C'},
                }
                
            ]
        }

        //console.log(amVoucher)

        return analytics_child

    }

    const AcctSpecificCalculations = (calcType) =>{
        if(calcType === 'HighestDepositAcct'){
            const dataM = data.filter(d => parseFloat(d['IC4PROLCYAMOUNT']) > 0)
            const tmpRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROLCYAMOUNT'])), d => d['IC4PROACCOUNT'])
            const tmpHighest= d3.least(tmpRollUp,([,sum])=> -sum)
            return [
                {name:'Account('+tmpHighest[0]+')',label:{fontSize: 14,fontWeight: 'bold' }},
                {name:'AcctTotCr('+NumberPattern(tmpHighest[1])+')',label:{fontSize: 14,fontWeight: 'bold' }},
                {name:'Percentage'}
            
            ]
        }else if(calcType === 'LowestDepositAcct'){
            const dataM = data.filter(d => parseFloat(d['IC4PROLCYAMOUNT']) > 0)
            const tmpRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROLCYAMOUNT'])), d => d['IC4PROACCOUNT'])
            const tmpLowest = d3.least(tmpRollUp,([,sum])=> sum)
            return [
                {name:'Account('+tmpLowest[0]+')',label:{fontSize: 14,fontWeight: 'bold' }},
                {name:'AcctTotCr('+NumberPattern(tmpLowest[1])+')',label:{fontSize: 14,fontWeight: 'bold' }},
                {name:'Percentage'}
            
            ]
        }else if(calcType === 'HighestWtdAcct'){
            const dataM = data.filter(d => parseFloat(d['IC4PROLCYAMOUNT']) < 0)
            const tmpRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROLCYAMOUNT'])), d => d['IC4PROACCOUNT'])
            const tmpHighest= d3.least(tmpRollUp,([,sum])=> sum)
            return [
                {name:'Account('+tmpHighest[0]+')',label:{fontSize: 14,fontWeight: 'bold' }},
                {name:'AcctTotDr('+NumberPattern(tmpHighest[1])+')',label:{fontSize: 14,fontWeight: 'bold' }},
                {name:'Percentage'}
            
            ]
        }else if(calcType === 'LowestWtdAcct'){
            const dataM = data.filter(d => parseFloat(d['IC4PROLCYAMOUNT']) < 0)
            const tmpRollUp = d3.rollup(dataM, v => d3.sum(v,d=>parseFloat(d['IC4PROLCYAMOUNT'])), d => d['IC4PROACCOUNT'])
            const tmpLowest = d3.least(tmpRollUp,([,sum])=> -sum)
            return [
                {name:'Account('+tmpLowest[0]+')',label:{fontSize: 14,fontWeight: 'bold' }},
                {name:'AcctTotDr('+NumberPattern(tmpLowest[1])+')',label:{fontSize: 14,fontWeight: 'bold' }},
                {name:'Percentage'}
            
            ]
        }
    }

    const TotalTransType = () =>{
        const dataCR = data.filter(d => parseFloat(d['IC4PROLCYAMOUNT']) > 0)
        const tmpCrRollUp = d3.rollup(dataCR, v => d3.sum(v,d=>parseFloat(d['IC4PROLCYAMOUNT'])), d => d['IC4PROTRANSTYPE'])
        const tmpHighCR = d3.least(tmpCrRollUp,([,sum])=> -sum)
        const tmpLowCR = d3.least(tmpCrRollUp,([,sum])=> sum)

        const dataDR = data.filter(d => parseFloat(d['IC4PROLCYAMOUNT']) < 0)
        const tmpDrRollUp = d3.rollup(dataDR, v => d3.sum(v,d=>parseFloat(d['IC4PROLCYAMOUNT'])), d => d['IC4PROTRANSTYPE'])
        const tmpHighDR = d3.least(tmpDrRollUp,([,sum])=> sum)
        const tmpLowDR = d3.least(tmpDrRollUp,([,sum])=> -sum)
        
        return [
            {name: 'HighestCrType('+tmpHighCR[0]+','+NumberPattern(tmpHighCR[1])+')',label:{fontSize: 14,fontWeight: 'bold' }},
            {name: 'LowestCrType('+tmpLowCR[0]+','+NumberPattern(tmpLowCR[1])+')',label:{fontSize: 14,fontWeight: 'bold' }},
            {name: 'HighestDrType('+tmpHighDR[0]+','+NumberPattern(tmpHighDR[1])+')',label:{fontSize: 14,fontWeight: 'bold' }},
            {name: 'LowestDrType('+tmpLowDR[0]+','+NumberPattern(tmpLowDR[1])+')',label:{fontSize: 14,fontWeight: 'bold' }},
            {name: 'Findings',label:{fontSize: 14,fontWeight: 'bold' }}
        ]
    }
    

    let treeDataCalc = {name:'callover',analytics: AnalyticsGenerator(data), 
        children: TreeGenerator('callover',data,'IC4PROREGION').map(d2 => {
        return {
            name:d2.name, 
            analytics: AnalyticsGenerator(d2.children),
            children: TreeGenerator(d2.name,d2.children,'IC4PROZONE').map(d3 => {
                return {
                    name:d3.name, 
                    analytics: AnalyticsGenerator(d3.children),
                    children: TreeGenerator(d3.name,d3.children,'ic4PROCLUSTER').map(d4 => {
                        return {
                            name:d4.name, 
                            analytics: AnalyticsGenerator(d4.children),
                            children: TreeGenerator(d4.name,d4.children,'IC4PROBRANCHCODE').map(d5 => {
                                return {
                                    name:d5.name,
                                    analytics: AnalyticsGenerator(d5.children),
                                    children: TreeGenerator(d5.name,d5.children,'IC4PROENTRYDATE').map(d6 => {
                                        return {
                                            name:d6.name,
                                            analytics: AnalyticsGenerator(d6.children),
                                            children: TreeGenerator(d6.name,d6.children,'IC4PROINPUTTER').map(d7 =>{
                                                return{
                                                    name:d7.name,
                                                   // analytics: AnalyticsGenerator(d7.children),
                                                    children: [
                                                        {
                                                            name:'Trans Type',
                                                            analytics:  AnalyticsGenerator(d7.children),
                                                            children: TreeGenerator(d7.name,d7.children,'IC4PROTRANSTYPE').map(d8=>{
                                                                return{
                                                                    name:d8.name,
                                                                    children: AnalyticsGenerator(d8.children).children
                                                                }
                                                            })
                                                        },
                                                        {
                                                            name:'Account Type',
                                                            analytics:  AnalyticsGenerator(d7.children),
                                                            children: TreeGenerator(d7.name,d7.children,'IC4PROACCOUNTTYPE').map(d8=>{
                                                                return{
                                                                    name:d8.name,
                                                                    children: AnalyticsGenerator(d8.children).children
                                                                }
                                                            })
                                                        }
                                                    ]

                                                    // children: TreeGenerator(d7.name,d7.children,'IC4PROTRANSTYPE').map(d8 => {
                                                    //     return{
                                                    //         name:d8.name
                                                    //     }
                                                    // })
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
    }
    )}

    const analytics_manipulation = async (arr) => {

        if(arr.analytics) arr.children.push(arr.analytics)
            arr.children.forEach(k1 => {
                if(k1.analytics) k1.children.push(k1.analytics)
                    k1.children.forEach(k2 => {
                        if(k2.analytics) k2.children.push(k2.analytics)
                        if(k2.children)k2.children.forEach(k3 => {
                            if(k3.analytics) k3.children.push(k3.analytics)
                            if(k3.children)k3.children.forEach(k4 => {
                                if(k4.analytics) k4.children.push(k4.analytics) 
                                if(k4.children)k4.children.forEach(k5 => {
                                    if(k5.analytics) k5.children.push(k5.analytics) 
                                    if(k5.children)k5.children.forEach(k6 => {
                                       // if(k6.analytics) k6.children.push(k6.analytics) 
                                    })
                                    
                                })
                            })

                        })
                        })
                    })
    }

    useEffect(()=>{
        analytics_manipulation(treeDataCalc).then(
            SetTreeData(treeDataCalc)
        )
    },[])
    
    


    
    return(
        <div>
            {treeData? <TreeMap data={treeData} /> : <Spinner />}
        </div>
        
        
        //     <ReactEcharts
        //     option={option}
        //     style={{ height: '900px' }}
        // />
        
    )
    }
export default TreeDataManipulator