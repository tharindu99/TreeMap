import React from "react"
import ReactEcharts from "echarts-for-react"
import * as d3 from 'd3'

const TreeMap = ({data}) => {

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

    const TreeGenerator = (groupBy,array,parameter) => {
        const child_arr =  Array.from(d3.group(array, d => d[parameter]), ([name,children]) => ({name,children}))
        return child_arr
    }

    const user_analytics = (arr) => {

        // const groupBy_trans = Array.from(d3.group(arr, d => d['IC4PROTRANSTYPE']), ([name,children]) => ({name,children})).map(d1=>{
        //     const data =  AnalyticsGenerator(d1.children)
        //     const AM = {name:'AM: '+(data.children[0].children[0].name).replace('AM','Cr')+' '+(data.children[1].children[0].name).replace('AM','Dr'), 
        //         label:data.children[0].label}
        //     const PM = {name:'PM: '+(data.children[0].children[1].name).replace('PM','Cr')+' '+(data.children[1].children[1].name).replace('PM','Dr'), 
        //     label:data.children[0].label}
        //     //     credit_AM.name = 'AM:'+credit_AM.name
        //     // let credit_PM =  AnalyticsGenerator(d1.children).children[0].children[1]
        //     //     credit_PM = 'Cr:'+credit_PM.name
        //     return{
        //         name:d1.name,
        //         children:[
        //            AM,
        //            PM,
                    
        //         ]
        //     }
        // })

        const groupBy_trans = Array.from(d3.group(arr, d => d['IC4PROTRANSTYPE']), ([name,children]) => ({name,children})).map(d2=>{
            const tmp = AnalyticsGenerator(d2.children)
            return{
                name:d2.name,
                analytics: tmp,
                children:[{name:'a'}]
            }
        })

        const groupBy_acc = Array.from(d3.group(arr, d => d['IC4PROACCOUNTTYPE']), ([name,children]) => ({name,children})).map(d2=>{
            console.log(AnalyticsGenerator(d2.children))
            const tmp = AnalyticsGenerator(d2.children)
            return{
                name:d2.name,
                analytics: tmp,
                children:d2.children
            }
        })
        

        const output = [
            {name:'Trans Type',
             analytics: groupBy_trans.analytics,
             children: [{name:'a'}]
            },
            {name:'Account Type',
             analytics:groupBy_acc.analytics,
             children: groupBy_acc.children
            }
            
        ]
        // const account_type = {name:'Account Type',
        //     children: TreeGenerator('type',arr,'IC4PROACCOUNTTYPE').map(k2=>{
        //         //console.log(AnalyticsGenerator(k2.children).children)
        //     return{
        //         name:k2.name,
        //         children: AnalyticsGenerator(k2.children).children
        //     }
        // })
        // }
        

        return output
        
    }

    let treeData = {name:'callover',analytics: AnalyticsGenerator(data), 
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
                                                    analytics: AnalyticsGenerator(d7.children),
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

    const analytics_manipulation = (arr) => {

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
                                       if(k6.analytics){
                                           //k6.children.push(k6.analytics)
                                           console.log(k6.children)
                                           //k6.children.push(k6.analytics)
                                        //    k6.children.forEach(k7 => {
                                        //        console.log(k7)
                                        //    });
                                       }
                                    })
                                })
                            })

                        })
                        })
                    })
                
                
            
            //     arr.children.forEach(k => {
            //         analytics_manipulation(k)
            //     });
                
        
        
    }
    analytics_manipulation(treeData)

    console.log(treeData)

    const option = {
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove'
        },
        
        series: [
          {
            type: 'tree',
            data: [treeData],
            top: '1%',
            left: '7%',
            bottom: '1%',
            right: '20%',
            symbolSize: 7,
            label: {
              position: 'left',
              verticalAlign: 'middle',
              align: 'right',
              fontSize: 9
            },
            leaves: {
              label: {
                position: 'right',
                verticalAlign: 'middle',
                align: 'left'
              }
            },
            emphasis: {
              focus: 'descendant'
            },
            expandAndCollapse: true,
            animationDuration: 550,
            animationDurationUpdate: 750
          }
        ]
      }
    
    return(
        
            <ReactEcharts
            option={option}
            style={{ height: '900px' }}
        />
        
    )
    }
export default TreeMap