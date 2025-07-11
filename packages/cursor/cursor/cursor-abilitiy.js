export class CursorAbility {
  static None = 0x0
  static Input = 0x1
  static Output = 0x2
  static Forward = 0x4
  static Bidirectional = 0x8 | CursorAbility.Forward
  static RandomAccess = 0x10 | CursorAbility.Bidirectional
  static Contiguous = 0x20 | CursorAbility.RandomAccess

  static hasAbility(abilities, ability) {
    return (abilities & ability) == ability
  }
  static isInput(abilities) { 
    return this.hasAbility(abilities, this.Input) 
  }
  static isOutput(abilities) { 
    return this.hasAbility(abilities, this.Output) 
  }
  static isForward(abilities) { 
    return this.hasAbility(abilities, this.Forward) 
  }
  static isBidirectional(abilities) { 
    return this.hasAbility(abilities, this.Bidirectional)
  }
  static isRandomAccess(abilities) { 
    return this.hasAbility(abilities, this.RandomAccess) 
  }
  static isContiguous(abilities) { 
    return this.hasAbility(abilities, this.Contiguous) 
  }
} 
