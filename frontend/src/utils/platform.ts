// 平台判断工具
export const isMP = () => {
  // #ifdef MP-WEIXIN
  return true
  // #endif
  // #ifdef H5
  return false
  // #endif
}

export const isH5 = () => !isMP()
