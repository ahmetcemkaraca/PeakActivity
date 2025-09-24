<template lang="pug">
div.aw-container
  .form-group
    label(for="category-select") Kategoriler
    select#category-select.form-control(
      multiple
      v-model="selectedCategories"
      @change="handleCategoryChange"
    )
      option(disabled value="") Bir kategori seçin...
      option(v-for="category in options" :key="category" :value="category") {{ category }}

  div.mt-2(v-if="value.length > 0")
    span.badge.badge-primary.mr-2.mb-2(v-for="tag in value" :key="tag")
      | {{ tag }}
      button.close.ml-1(@click="removeTag(tag)") &times;
</template>

<script lang="typescript">
import Vue from 'vue';
import { useCategoryStore } from '~/stores/categories';

const SEP = ' > ';

export default Vue.extend({
  props: {
    value: {
      // Mevcut seçili kategoriler
      type: Array as () => string[][],
      default: () => [],
    },
  },
  data() {
    return {
      selectedCategories: [],
    };
  },

  computed: {
    options() {
      const classes = useCategoryStore().classes;
      return classes.map(category => category.name.join(SEP));
    },
  },

  watch: {
    value: {
      immediate: true,
      handler(newVal) {
        this.selectedCategories = newVal.map(v => v.join(SEP));
      },
    },
  },

  methods: {
    handleCategoryChange() {
      const category_names = this.selectedCategories.map(v => v.split(SEP));
      this.$emit('input', category_names);
    },
    removeTag(tagToRemove: string) {
      this.selectedCategories = this.selectedCategories.filter(tag => tag !== tagToRemove);
      this.handleCategoryChange();
    },
  },
});
</script>

<style scoped lang="scss">
@import '../style/globals';

.badge {
  background-color: $activeHighlightColor;
  color: white;
  padding: 0.5em 0.75em;
  border-radius: 0.25rem;
  .close {
    color: white;
    opacity: 0.8;
    &:hover {
      opacity: 1;
    }
  }
}

.form-control {
  &:focus {
    border-color: $activeHighlightColor;
    box-shadow: 0 0 0 0.2rem rgba($activeHighlightColor, 0.25);
  }
}
</style>
