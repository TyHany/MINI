Component({
  properties: {
    count: {
      type: Number,
      value: 0
    }
  },

  methods: {
    onClick() {
      this.triggerEvent('click');
    }
  }
}); 