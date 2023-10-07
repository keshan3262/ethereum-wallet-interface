module.exports = {
  babel: {
    plugins: [
      ['@babel/plugin-proposal-class-properties', { loose: false }],
      ['@babel/plugin-transform-private-methods', { loose: false }],
      ['@babel/plugin-transform-private-property-in-object', { loose: false }]
    ]
    /* "plugins": [["@babel/plugin-proposal-class-properties"]],
    "assumptions": {
        "setPublicClassFields": false
    } */
  }
}