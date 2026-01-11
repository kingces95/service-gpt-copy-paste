import { 
  Es6MethodDescriptor,
  Es6FieldDescriptor,
  Es6GetterDescriptor,
  Es6SetterDescriptor,
  Es6PropertyDescriptor,
} from '@kingjs/es6-descriptor'
import { 
  Es6MethodDescriptorInfo,
  Es6FieldDescriptorInfo,
  Es6GetterDescriptorInfo,
  Es6SetterDescriptorInfo,
  Es6PropertyDescriptorInfo,
} from '@kingjs/es6-info'
import { abstract } from '@kingjs/abstract'

const GetterMd = {
  name: 'getter',
  descriptor: { 
    get: function myGetter() {},
    enumerable: Es6GetterDescriptor.DefaultEnumerable,
    configurable: Es6GetterDescriptor.DefaultConfigurable,
  },
  infoType: Es6GetterDescriptorInfo,
  type: 'getter',
  modifiers: [  ],
  toString: 'getter',
}

const EnumerableGetterMd = {
  name: 'enumerable getter',
  descriptor: { 
    get: function myEnumerableGetter() {},
    enumerable: true,
    configurable: Es6GetterDescriptor.DefaultConfigurable,
  },
  infoType: Es6GetterDescriptorInfo,
  type: 'getter',
  modifiers: [ 'visible' ],
  toString: 'visible getter',
}

const OtherGetterMd = {
  ...GetterMd,
  name: 'other getter',
  descriptor: { 
    get: function otherGetter() {},
    enumerable: Es6GetterDescriptor.DefaultEnumerable,
    configurable: Es6GetterDescriptor.DefaultConfigurable,
  },
}

const SetterMd = {
  name: 'setter',
  descriptor: {
    set: function mySetter(v) {},
    enumerable: Es6SetterDescriptor.DefaultEnumerable,
    configurable: Es6SetterDescriptor.DefaultConfigurable,
  },
  infoType: Es6SetterDescriptorInfo,
  type: 'setter',
  modifiers: [  ],
  toString: 'setter',
}

const OtherSetterMd = {
  ...SetterMd,
  name: 'other setter',
  descriptor: {
    set: function otherSetter(v) {},
    enumerable: Es6SetterDescriptor.DefaultEnumerable,
    configurable: Es6SetterDescriptor.DefaultConfigurable,
  },
}

const PropertyMd = {
  name: 'property',
  descriptor: {
    get: function myPropertyGetter() {},
    set: function myPropertySetter(v) {},
    enumerable: Es6PropertyDescriptor.DefaultEnumerable,
    configurable: Es6PropertyDescriptor.DefaultConfigurable,
  },
  infoType: Es6PropertyDescriptorInfo,
  type: 'property',
  modifiers: [ ],
  toString: 'property',
}

const MethodMd = {
  name: 'method',
  descriptor: {
    value: function myMethod() {},
    enumerable: false,
    configurable: Es6MethodDescriptor.DefaultConfigurable,
    writable: Es6MethodDescriptor.DefaultWritable,
  },
  infoType: Es6MethodDescriptorInfo,
  type: 'method',
  modifiers: [  ],
  toString: 'method',
}

const FunctionMd = {
  name: 'visible method',
  descriptor: {
    value: function myVisibleMethod() {},
    enumerable: true,
    configurable: Es6MethodDescriptor.DefaultConfigurable,
    writable: Es6MethodDescriptor.DefaultWritable,
  },
  infoType: Es6FieldDescriptorInfo,
  type: 'field',
  fieldType: 'function',
  modifiers: [  ],
  toString: 'field [function]',
}

const ConstMethodMd = {
  name: 'const method',
  descriptor: {
    value: function myConstMethod() {},
    enumerable: false,
    configurable: Es6MethodDescriptor.DefaultConfigurable,
    writable: false,
  },
  infoType: Es6MethodDescriptorInfo,
  type: 'method',
  modifiers: [ 'const' ],
  toString: 'const method',
}

const SealedMethodMd = {
  name: 'sealed method',
  descriptor: {
    value: function mySealedMethod() {},
    enumerable: false,
    configurable: false,
    writable: Es6MethodDescriptor.DefaultWritable,
  },
  infoType: Es6MethodDescriptorInfo,
  type: 'method',
  modifiers: [ 'sealed' ],
  toString: 'sealed method',
}

const AbstractMethodMd = {
  name: 'abstract method',
  descriptor: {
    value: abstract,
    enumerable: false,
    configurable: Es6MethodDescriptor.DefaultConfigurable,
    writable: Es6MethodDescriptor.DefaultWritable,
  },
  infoType: Es6MethodDescriptorInfo,
  type: 'method',
  isAbstract: true,
  modifiers: [  ],
  toString: 'abstract method',
}

const NumberMd = {
  name: 'number',
  descriptor: {
    value: 42,
    enumerable: true,
    configurable: Es6FieldDescriptor.DefaultConfigurable,
    writable: Es6FieldDescriptor.DefaultWritable,
  },
  infoType: Es6FieldDescriptorInfo,
  type: 'field',
  fieldType: 'number',
  modifiers: [  ],
  toString: 'field [number]',
}

const HiddenNumberMd = {
  name: 'hidden number',
  descriptor: {
    value: 42,
    enumerable: false,
    configurable: Es6FieldDescriptor.DefaultConfigurable,
    writable: Es6FieldDescriptor.DefaultWritable,
  },
  infoType: Es6FieldDescriptorInfo,
  type: 'field',
  fieldType: 'number',
  modifiers: [ 'hidden' ],
  toString: 'hidden field [number]',
}

const ConstNumberMd = {
  name: 'const number',
  descriptor: {
    value: 42,
    enumerable: true,
    configurable: Es6FieldDescriptor.DefaultConfigurable,
    writable: false,
  },
  infoType: Es6FieldDescriptorInfo,
  type: 'field',
  fieldType: 'number',
  modifiers: [ 'const' ],
  toString: 'const field [number]',
}

const NanNumberMd = {
  name: 'NaN number',
  descriptor: {
    value: NaN,
    enumerable: true,
    configurable: Es6FieldDescriptor.DefaultConfigurable,
    writable: Es6FieldDescriptor.DefaultWritable,
  },
  infoType: Es6FieldDescriptorInfo,
  type: 'field',
  fieldType: 'number',
  modifiers: [  ],
  toString: 'field [number]',
}

export const Descriptors = [
  [ GetterMd.name, GetterMd ],
  [ EnumerableGetterMd.name, EnumerableGetterMd ],
  [ OtherGetterMd.name, OtherGetterMd ],
  [ SetterMd.name, SetterMd ],
  [ OtherSetterMd.name, OtherSetterMd ],
  [ PropertyMd.name, PropertyMd ],
  [ MethodMd.name, MethodMd ],
  [ FunctionMd.name, FunctionMd ],
  [ ConstMethodMd.name, ConstMethodMd ],
  [ SealedMethodMd.name, SealedMethodMd ],
  [ AbstractMethodMd.name, AbstractMethodMd ],
  [ NumberMd.name, NumberMd ],
  [ HiddenNumberMd.name, HiddenNumberMd ],
  [ ConstNumberMd.name, ConstNumberMd ],
  [ NanNumberMd.name, NanNumberMd ],
]
