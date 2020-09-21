'use strict';
var ucs2length = require('ajv/lib/compile/ucs2length');
var equal = require('ajv/lib/compile/equal');
var validate = (function() {
  var pattern0 = new RegExp('^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$');
  var refVal = [];
  return function validate(data, dataPath, parentData, parentDataProperty, rootData) {
    'use strict';
    var vErrors = null;
    var errors = 0;
    if (rootData === undefined) rootData = data;
    if ((data && typeof data === "object" && !Array.isArray(data))) {
      if (true) {
        var errs__0 = errors;
        var valid1 = true;
        for (var key0 in data) {
          var isAdditional0 = !(false || key0 == 'id' || key0 == 'types' || key0 == 'name' || key0 == 'code' || key0 == 'pattern' || key0 == 'theme' || key0 == 'version');
          if (isAdditional0) {
            valid1 = false;
            validate.errors = [{
              keyword: 'additionalProperties',
              dataPath: (dataPath || '') + "",
              schemaPath: '#/additionalProperties',
              params: {
                additionalProperty: '' + key0 + ''
              },
              message: 'should NOT have additional properties'
            }];
            return false;
            break;
          }
        }
        if (valid1) {
          var data1 = data.id;
          if (data1 === undefined) {
            valid1 = false;
            validate.errors = [{
              keyword: 'required',
              dataPath: (dataPath || '') + "",
              schemaPath: '#/required',
              params: {
                missingProperty: 'id'
              },
              message: 'should have required property \'id\''
            }];
            return false;
          } else {
            var errs_1 = errors;
            if (typeof data1 === "string") {
              if (ucs2length(data1) < 1) {
                validate.errors = [{
                  keyword: 'minLength',
                  dataPath: (dataPath || '') + '.id',
                  schemaPath: '#/properties/id/minLength',
                  params: {
                    limit: 1
                  },
                  message: 'should NOT be shorter than 1 characters'
                }];
                return false;
              } else {}
            } else {
              validate.errors = [{
                keyword: 'type',
                dataPath: (dataPath || '') + '.id',
                schemaPath: '#/properties/id/type',
                params: {
                  type: 'string'
                },
                message: 'should be string'
              }];
              return false;
            }
            if (errors === errs_1) {}
            var valid1 = errors === errs_1;
          }
          if (valid1) {
            var data1 = data.types;
            if (data1 === undefined) {
              valid1 = true;
            } else {
              var errs_1 = errors;
              if (Array.isArray(data1)) {
                var errs__1 = errors;
                var valid1;
                for (var i1 = 0; i1 < data1.length; i1++) {
                  var data2 = data1[i1];
                  var errs_2 = errors;
                  if (typeof data2 !== "string") {
                    validate.errors = [{
                      keyword: 'type',
                      dataPath: (dataPath || '') + '.types[' + i1 + ']',
                      schemaPath: '#/properties/types/items/type',
                      params: {
                        type: 'string'
                      },
                      message: 'should be string'
                    }];
                    return false;
                  }
                  var schema2 = validate.schema.properties.types.items.enum;
                  var valid2;
                  valid2 = false;
                  for (var i2 = 0; i2 < schema2.length; i2++)
                    if (equal(data2, schema2[i2])) {
                      valid2 = true;
                      break;
                    } if (!valid2) {
                    validate.errors = [{
                      keyword: 'enum',
                      dataPath: (dataPath || '') + '.types[' + i1 + ']',
                      schemaPath: '#/properties/types/items/enum',
                      params: {
                        allowedValues: schema2
                      },
                      message: 'should be equal to one of the allowed values'
                    }];
                    return false;
                  } else {}
                  if (errors === errs_2) {}
                  var valid2 = errors === errs_2;
                  if (!valid2) break;
                }
                if (errs__1 == errors) {}
              } else {
                validate.errors = [{
                  keyword: 'type',
                  dataPath: (dataPath || '') + '.types',
                  schemaPath: '#/properties/types/type',
                  params: {
                    type: 'array'
                  },
                  message: 'should be array'
                }];
                return false;
              }
              if (errors === errs_1) {}
              var valid1 = errors === errs_1;
            }
            if (valid1) {
              var data1 = data.name;
              if (data1 === undefined) {
                valid1 = false;
                validate.errors = [{
                  keyword: 'required',
                  dataPath: (dataPath || '') + "",
                  schemaPath: '#/required',
                  params: {
                    missingProperty: 'name'
                  },
                  message: 'should have required property \'name\''
                }];
                return false;
              } else {
                var errs_1 = errors;
                if (typeof data1 === "string") {
                  if (ucs2length(data1) < 1) {
                    validate.errors = [{
                      keyword: 'minLength',
                      dataPath: (dataPath || '') + '.name',
                      schemaPath: '#/properties/name/minLength',
                      params: {
                        limit: 1
                      },
                      message: 'should NOT be shorter than 1 characters'
                    }];
                    return false;
                  } else {}
                } else {
                  validate.errors = [{
                    keyword: 'type',
                    dataPath: (dataPath || '') + '.name',
                    schemaPath: '#/properties/name/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  }];
                  return false;
                }
                if (errors === errs_1) {}
                var valid1 = errors === errs_1;
              }
              if (valid1) {
                if (data.code === undefined) {
                  valid1 = false;
                  validate.errors = [{
                    keyword: 'required',
                    dataPath: (dataPath || '') + "",
                    schemaPath: '#/required',
                    params: {
                      missingProperty: 'code'
                    },
                    message: 'should have required property \'code\''
                  }];
                  return false;
                } else {
                  var errs_1 = errors;
                  if (typeof data.code !== "string") {
                    validate.errors = [{
                      keyword: 'type',
                      dataPath: (dataPath || '') + '.code',
                      schemaPath: '#/properties/code/type',
                      params: {
                        type: 'string'
                      },
                      message: 'should be string'
                    }];
                    return false;
                  }
                  var valid1 = errors === errs_1;
                }
                if (valid1) {
                  if (data.pattern === undefined) {
                    valid1 = true;
                  } else {
                    var errs_1 = errors;
                    if (typeof data.pattern !== "string") {
                      validate.errors = [{
                        keyword: 'type',
                        dataPath: (dataPath || '') + '.pattern',
                        schemaPath: '#/properties/pattern/type',
                        params: {
                          type: 'string'
                        },
                        message: 'should be string'
                      }];
                      return false;
                    }
                    var valid1 = errors === errs_1;
                  }
                  if (valid1) {
                    var data1 = data.theme;
                    if (data1 === undefined) {
                      valid1 = false;
                      validate.errors = [{
                        keyword: 'required',
                        dataPath: (dataPath || '') + "",
                        schemaPath: '#/required',
                        params: {
                          missingProperty: 'theme'
                        },
                        message: 'should have required property \'theme\''
                      }];
                      return false;
                    } else {
                      var errs_1 = errors;
                      if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
                        if (true) {
                          var errs__1 = errors;
                          var valid2 = true;
                          for (var key1 in data1) {
                            var isAdditional1 = !(false || key1 == 'textColor' || key1 == 'backgroundColor');
                            if (isAdditional1) {
                              valid2 = false;
                              validate.errors = [{
                                keyword: 'additionalProperties',
                                dataPath: (dataPath || '') + '.theme',
                                schemaPath: '#/properties/theme/additionalProperties',
                                params: {
                                  additionalProperty: '' + key1 + ''
                                },
                                message: 'should NOT have additional properties'
                              }];
                              return false;
                              break;
                            }
                          }
                          if (valid2) {
                            var data2 = data1.textColor;
                            if (data2 === undefined) {
                              valid2 = false;
                              validate.errors = [{
                                keyword: 'required',
                                dataPath: (dataPath || '') + '.theme',
                                schemaPath: '#/properties/theme/required',
                                params: {
                                  missingProperty: 'textColor'
                                },
                                message: 'should have required property \'textColor\''
                              }];
                              return false;
                            } else {
                              var errs_2 = errors;
                              if (typeof data2 === "string") {
                                if (!pattern0.test(data2)) {
                                  validate.errors = [{
                                    keyword: 'pattern',
                                    dataPath: (dataPath || '') + '.theme.textColor',
                                    schemaPath: '#/properties/theme/properties/textColor/pattern',
                                    params: {
                                      pattern: '^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$'
                                    },
                                    message: 'should match pattern "^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$"'
                                  }];
                                  return false;
                                } else {}
                              } else {
                                validate.errors = [{
                                  keyword: 'type',
                                  dataPath: (dataPath || '') + '.theme.textColor',
                                  schemaPath: '#/properties/theme/properties/textColor/type',
                                  params: {
                                    type: 'string'
                                  },
                                  message: 'should be string'
                                }];
                                return false;
                              }
                              if (errors === errs_2) {}
                              var valid2 = errors === errs_2;
                            }
                            if (valid2) {
                              var data2 = data1.backgroundColor;
                              if (data2 === undefined) {
                                valid2 = false;
                                validate.errors = [{
                                  keyword: 'required',
                                  dataPath: (dataPath || '') + '.theme',
                                  schemaPath: '#/properties/theme/required',
                                  params: {
                                    missingProperty: 'backgroundColor'
                                  },
                                  message: 'should have required property \'backgroundColor\''
                                }];
                                return false;
                              } else {
                                var errs_2 = errors;
                                if (typeof data2 === "string") {
                                  if (!pattern0.test(data2)) {
                                    validate.errors = [{
                                      keyword: 'pattern',
                                      dataPath: (dataPath || '') + '.theme.backgroundColor',
                                      schemaPath: '#/properties/theme/properties/backgroundColor/pattern',
                                      params: {
                                        pattern: '^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$'
                                      },
                                      message: 'should match pattern "^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$"'
                                    }];
                                    return false;
                                  } else {}
                                } else {
                                  validate.errors = [{
                                    keyword: 'type',
                                    dataPath: (dataPath || '') + '.theme.backgroundColor',
                                    schemaPath: '#/properties/theme/properties/backgroundColor/type',
                                    params: {
                                      type: 'string'
                                    },
                                    message: 'should be string'
                                  }];
                                  return false;
                                }
                                if (errors === errs_2) {}
                                var valid2 = errors === errs_2;
                              }
                              if (valid2) {}
                            }
                          }
                          if (errs__1 == errors) {}
                        }
                      } else {
                        validate.errors = [{
                          keyword: 'type',
                          dataPath: (dataPath || '') + '.theme',
                          schemaPath: '#/properties/theme/type',
                          params: {
                            type: 'object'
                          },
                          message: 'should be object'
                        }];
                        return false;
                      }
                      if (errors === errs_1) {}
                      var valid1 = errors === errs_1;
                    }
                    if (valid1) {
                      if (data.version === undefined) {
                        valid1 = false;
                        validate.errors = [{
                          keyword: 'required',
                          dataPath: (dataPath || '') + "",
                          schemaPath: '#/required',
                          params: {
                            missingProperty: 'version'
                          },
                          message: 'should have required property \'version\''
                        }];
                        return false;
                      } else {
                        var errs_1 = errors;
                        var schema1 = validate.schema.properties.version.const;
                        var valid1 = equal(data.version, schema1);
                        if (!valid1) {
                          validate.errors = [{
                            keyword: 'const',
                            dataPath: (dataPath || '') + '.version',
                            schemaPath: '#/properties/version/const',
                            params: {
                              allowedValue: schema1
                            },
                            message: 'should be equal to constant'
                          }];
                          return false;
                        } else {}
                        if (errors === errs_1) {}
                        var valid1 = errors === errs_1;
                      }
                      if (valid1) {}
                    }
                  }
                }
              }
            }
          }
        }
        if (errs__0 == errors) {}
      }
    } else {
      validate.errors = [{
        keyword: 'type',
        dataPath: (dataPath || '') + "",
        schemaPath: '#/type',
        params: {
          type: 'object'
        },
        message: 'should be object'
      }];
      return false;
    }
    if (errors === 0) {}
    validate.errors = vErrors;
    return errors === 0;
  };
})();
validate.schema = {
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "minLength": 1
    },
    "types": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["page", "text", "image"]
      }
    },
    "name": {
      "type": "string",
      "minLength": 1
    },
    "code": {
      "type": "string"
    },
    "pattern": {
      "type": "string"
    },
    "theme": {
      "type": "object",
      "properties": {
        "textColor": {
          "type": "string",
          "pattern": "^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$"
        },
        "backgroundColor": {
          "type": "string",
          "pattern": "^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$"
        }
      },
      "required": ["textColor", "backgroundColor"],
      "additionalProperties": false
    },
    "version": {
      "const": 1
    }
  },
  "required": ["id", "name", "code", "theme", "version"],
  "additionalProperties": false
};
validate.errors = null;
module.exports = validate;