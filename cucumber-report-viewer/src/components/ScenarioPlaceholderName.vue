<template>
  <div class="scenario-placeholder-name">
    <span class="placeholder-name" :class="{ 'with-tooltip': showTooltip }">
      <v-tooltip v-if="showTooltip" :text="tooltipText" location="top">
        <template v-slot:activator="{ props }">
          <span v-bind="props" class="name-with-indicator">
            <v-icon size="14" color="warning" class="mr-1">mdi-alert</v-icon>
            {{ displayName }}
          </span>
        </template>
      </v-tooltip>
      <span v-else class="name-without-tooltip">{{ displayName }}</span>
    </span>

    <!-- Optional edit functionality -->
    <v-btn
      v-if="editable"
      icon
      size="x-small"
      variant="text"
      class="edit-name-btn ml-1"
      @click="startEditing"
      :title="'Edit scenario name'"
    >
      <v-icon size="12">mdi-pencil</v-icon>
    </v-btn>

    <!-- Edit dialog -->
    <v-dialog v-model="editing" max-width="500px">
      <v-card class="edit-name-dialog">
        <v-card-title class="edit-dialog-header">
          <v-icon color="primary" size="20" class="mr-2">mdi-text-box-edit</v-icon>
          <span>Edit Scenario Name</span>
        </v-card-title>

        <v-card-text class="edit-dialog-content">
          <div class="current-info mb-4">
            <p class="text-body-2 text-medium-emphasis">
              Current placeholder: <strong>{{ displayName }}</strong>
            </p>
            <p class="text-caption text-medium-emphasis">
              This scenario originally had an empty or missing name.
            </p>
          </div>

          <v-text-field
            v-model="editedName"
            label="New scenario name"
            placeholder="Enter a meaningful name for this scenario"
            variant="outlined"
            density="comfortable"
            :rules="nameRules"
            autofocus
            @keyup.enter="saveName"
          ></v-text-field>

          <div class="suggestions mt-3">
            <p class="text-caption text-medium-emphasis mb-2">Suggestions based on scenario content:</p>
            <v-chip-group class="suggestion-chips">
              <v-chip
                v-for="suggestion in nameSuggestions"
                :key="suggestion"
                size="small"
                variant="outlined"
                @click="editedName = suggestion"
                class="suggestion-chip"
              >
                {{ suggestion }}
              </v-chip>
            </v-chip-group>
          </div>
        </v-card-text>

        <v-card-actions class="edit-dialog-actions">
          <v-btn variant="text" @click="cancelEditing">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="elevated"
            @click="saveName"
            :disabled="!isValidName"
          >
            Save Name
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'ScenarioPlaceholderName',
  props: {
    scenario: {
      type: Object,
      required: true
    },
    displayName: {
      type: String,
      required: true
    },
    showTooltip: {
      type: Boolean,
      default: true
    },
    editable: {
      type: Boolean,
      default: false
    },
    suggestions: {
      type: Array,
      default: () => []
    }
  },
  emits: ['name-changed', 'edit-started', 'edit-cancelled'],
  data() {
    return {
      editing: false,
      editedName: '',
      nameRules: [
        v => !!v || 'Scenario name is required',
        v => (v && v.length >= 3) || 'Name must be at least 3 characters',
        v => (v && v.length <= 100) || 'Name must be less than 100 characters'
      ]
    };
  },
  computed: {
    tooltipText() {
      return `This scenario originally had an empty name. Generated placeholder: "${this.displayName}"`;
    },
    
    isValidName() {
      return this.editedName && 
             this.editedName.length >= 3 && 
             this.editedName.length <= 100;
    },
    
    nameSuggestions() {
      if (this.suggestions.length > 0) {
        return this.suggestions;
      }
      
      // Generate suggestions based on scenario content
      const suggestions = [];
      
      // From scenario steps
      if (this.scenario.steps && this.scenario.steps.length > 0) {
        const firstStep = this.scenario.steps[0];
        if (firstStep.name) {
          // Extract action from first step
          const stepText = firstStep.name.toLowerCase();
          if (stepText.includes('login')) {
            suggestions.push('User Login Test');
          } else if (stepText.includes('register') || stepText.includes('sign up')) {
            suggestions.push('User Registration Test');
          } else if (stepText.includes('search')) {
            suggestions.push('Search Functionality Test');
          } else if (stepText.includes('click') || stepText.includes('button')) {
            suggestions.push('Button Interaction Test');
          } else {
            // Generic suggestion based on first step
            const words = stepText.split(' ').slice(0, 3);
            const suggestion = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Test';
            suggestions.push(suggestion);
          }
        }
      }
      
      // From scenario tags
      if (this.scenario.tags && this.scenario.tags.length > 0) {
        this.scenario.tags.forEach(tag => {
          const tagName = typeof tag === 'string' ? tag : tag.name;
          if (tagName) {
            const cleanTag = tagName.replace(/[@{}]/g, '').trim();
            if (cleanTag.length > 0) {
              suggestions.push(`${cleanTag.charAt(0).toUpperCase() + cleanTag.slice(1)} Test`);
            }
          }
        });
      }
      
      // Default suggestions
      if (suggestions.length === 0) {
        suggestions.push('Test Scenario', 'Validation Test', 'Functional Test');
      }
      
      // Remove duplicates and limit to 5
      return [...new Set(suggestions)].slice(0, 5);
    }
  },
  methods: {
    startEditing() {
      this.editedName = '';
      this.editing = true;
      this.$emit('edit-started', this.scenario);
    },
    
    cancelEditing() {
      this.editing = false;
      this.editedName = '';
      this.$emit('edit-cancelled', this.scenario);
    },
    
    saveName() {
      if (!this.isValidName) return;
      
      const newName = this.editedName.trim();
      this.editing = false;
      
      this.$emit('name-changed', {
        scenario: this.scenario,
        oldName: this.displayName,
        newName: newName
      });
      
      this.editedName = '';
    }
  }
};
</script>

<style scoped>
.scenario-placeholder-name {
  display: inline-flex;
  align-items: center;
}

.placeholder-name {
  font-style: italic;
  color: #666;
  position: relative;
}

.name-with-indicator {
  display: inline-flex;
  align-items: center;
  padding: 2px 4px;
  border-radius: 4px;
  background-color: rgba(255, 152, 0, 0.1);
  border: 1px solid rgba(255, 152, 0, 0.2);
}

.name-without-tooltip {
  color: #666;
}

.edit-name-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.scenario-placeholder-name:hover .edit-name-btn {
  opacity: 1;
}

.edit-name-dialog {
  border-left: 4px solid #2196f3;
}

.edit-dialog-header {
  background-color: rgba(33, 150, 243, 0.05);
  border-bottom: 1px solid rgba(33, 150, 243, 0.1);
  font-size: 16px;
  font-weight: 600;
}

.edit-dialog-content {
  padding: 20px;
}

.current-info {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  padding: 12px;
  border-left: 3px solid #ff9800;
}

.suggestions {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 12px;
}

.suggestion-chips {
  gap: 8px;
}

.suggestion-chip {
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-chip:hover {
  background-color: rgba(33, 150, 243, 0.1);
  border-color: #2196f3;
}

.edit-dialog-actions {
  padding: 16px 20px;
  background-color: rgba(0, 0, 0, 0.02);
}

/* Dark theme support */
.theme--dark .placeholder-name {
  color: #bbb;
}

.theme--dark .name-with-indicator {
  background-color: rgba(255, 152, 0, 0.2);
  border-color: rgba(255, 152, 0, 0.3);
}

.theme--dark .edit-dialog-header {
  background-color: rgba(33, 150, 243, 0.1);
}

.theme--dark .current-info {
  background-color: rgba(255, 255, 255, 0.05);
}

.theme--dark .suggestions {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.theme--dark .edit-dialog-actions {
  background-color: rgba(255, 255, 255, 0.05);
}

/* Responsive design */
@media (max-width: 768px) {
  .edit-dialog-content {
    padding: 16px;
  }
  
  .suggestion-chips {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Animation for placeholder indicator */
.name-with-indicator {
  animation: subtle-pulse 3s ease-in-out infinite;
}

@keyframes subtle-pulse {
  0%, 100% {
    background-color: rgba(255, 152, 0, 0.1);
  }
  50% {
    background-color: rgba(255, 152, 0, 0.15);
  }
}

/* Accessibility improvements */
.edit-name-btn:focus {
  opacity: 1;
  outline: 2px solid #2196f3;
  outline-offset: 2px;
}

.suggestion-chip:focus {
  outline: 2px solid #2196f3;
  outline-offset: 2px;
}
</style>