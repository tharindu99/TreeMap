import React from "react"
import ReactEcharts from "echarts-for-react"
import * as d3 from 'd3'

const TreeMap = ({data}) => {

  const formatTime = d3.timeFormat("%Y%d%m-%H%M%S");
  const timeStamp = formatTime(Date.now())

    const option = {
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove'
        },
        toolbox: {
          show: true,
          feature: {
            saveAsImage: { 
              show: true,
              name:'ic4proDecisonTree-'+timeStamp
            }
          }
        },
        
        series: [
          {
            type: 'tree',
            data: [data],
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