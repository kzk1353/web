import c from '../../utils/console';

const app = getApp();
const appData = app.data;
let comp;

const compObj = {
  options: {
    multipleSlots: true,
  },
  externalClasses: ['myclass'],
  data: {},
  properties: {
    myprop: {
      type: Object,
      value: {},
      // observer(newVal, oldVal, changedPath) {
      //   comp = this;
      // },
    },
  },
  attached() {
    comp = this;
    comp.setData({
      userInfo: appData.userInfo,
    });

    const date = new Date().toDateString();

    /* 测试 */
    // date = 0;
    // return;
    /* 测试 */

    if (date === wx.getStorageSync('signTime')) {
      // 如果当天已经签到
      wx.setStorageSync('signTime', date);
      comp.triggerEvent('close', {}, { bubbles: true });
    } else {
      // 如果当天还没签到
      app
        .api('getSign')
        .then((res) => {
          /* 测试 */
          // res.today_take = false;
          /* 测试 */

          if (res.today_take) {
            // 如果已经签到7天
            wx.setStorageSync('signTime', date);
            comp.triggerEvent('close', {}, { bubbles: true });
          } else {
            // 如果还没签到7天
            const signList = [];
            const { list, week_day_scores: rule } = res; // 已签对象列表
            let active = false; // 是否为当天状态
            for (let i = 0; i < 7; i += 1) {
              const item = {
                score: rule[i],
              };

              if (list[i]) {
                // 如果已签到
                item.hasSign = true;
              } else if (!active) {
                // 如果未签到
                active = true;
                item.active = true;
              }

              signList.push(item);
            }

            comp.setData({
              signList,
            });
          }
        })
        .catch(() => wx.reLaunch({ url: '/pages/index/index' }));
    }
  },
  detached() {},
  methods: {
    trigger(e, isBubble) {
      const data = e.currentTarget.dataset;
      const {
        trigger, bubbles, composed, capturePhase,
      } = data;

      let opt;
      if (isBubble) {
        opt = { bubbles: true, composed: true };
      } else {
        opt = {
          bubbles,
          composed,
          capturePhase,
        };
      }

      this.triggerEvent(trigger || 'trigger', data, opt);
    },

    putSign() {
      app
        .api('putSign')
        .then((res) => {
          /* // 签到动画
            let signList = comp.data.signList;
            let active = signList.find(i => i.active);
            active.anime = true;
            active.hasSign = true;
            comp.setData({
              signList,
            });
          */

          app.setGold(+res.total_score, true);
          return `金币+${res.add_score}`;
        }, res => res.m)
        .then((res) => {
          wx.showToast({
            title: res,
            icon: 'none',
          });

          wx.setStorageSync('signTime', new Date().toDateString());

          setTimeout(() => {
            comp.triggerEvent('close', {}, { bubbles: true });
          }, 1500);
        })
        .catch(() => wx.reLaunch({ url: '/pages/index/index' }));
    },
  },
};

Component(compObj);
