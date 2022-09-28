const Mock = require('mockjs')

Mock.Random.extend({
  dataCapacity() {
    const dataCapacity = ['10GB', '15GB', '20GB', '25GB']
    return this.pick(dataCapacity)
  },
  dataSpeed() {
    const dataSpeed = ['20MB/s', '25MB/s', '30MB/s', '35MB/s', '40MB/s']
    return this.pick(dataSpeed)
  }
})

const mockData = Mock.mock({
  'rehearsals|10': [{
    'task_id': '@guid', // id
    'source_client': '@ctitle', // 源客户端名称
    'sync_data_total': '@DATACAPACITY', // 同步数据总量,例如'20GB'
    'sync_time_consumption': '@time', // 同步阶段耗时,例如'00:54:00'
    'sync_speed': '@DATASPEED', // 平均同步速度，例如'20MB/s'
    'verify_file_total': '@integer', // 验证文件总数，例如'10'
    'verify_data_total': '@DATACAPACITY', // 验证数据总量,例如'20GB'
    'verify_time_consumption': '@time', // 验证阶段耗时,例如'00:54:00'
    'switch_time': '@datetime', // 切换数据时刻点，例如'2022-04-19 13:14:15'
    'switch_time_consumption': '@time', // 切换阶段耗时,例如'00:54:00'
    'migration_time_total': '@time'
  }]
})

const rehearsals = mockData.rehearsals

module.exports = [
  {
    url: '/api/report/get_migration_report',
    type: 'POST',
    response: req => {
      return {
        r: 0,
        e: '',
        data: rehearsals
      }
    },
    status: 200
  }
]
