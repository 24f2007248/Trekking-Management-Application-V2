const AdminAddTrek = {
  components: {
    AdminLayout: window.AdminLayout
  },

  emits: ["navigate", "logout"],

  props: {
    trekId: {
      type: Number,
      default: null
    }
  },

  data() {
    return {
      adminName: "Admin",

      form: {
        trekname: "",
        location: "",
        difficulty: "",
        duration: 1,
        slots: 10,
        start_date: "",
        end_date: "",
        staff_id: "",
        status: "Open",
        description: ""
      },

      staffList: []
    };
  },

  async mounted() {
    await this.loadStaff();
    console.log("Received trekId:", this.trekId);

    if (this.trekId) {
      await this.loadTrek();
      console.log("Received trekId:", this.trekId);
    }
  },

  methods: {
    async loadStaff() {
      try {
        const response = await fetch("/api/admin/staff-list", {
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.staffList = result.data.staff || [];
        }
      } catch (err) {
        console.error(err);
      }
    },

    async loadTrek() {
      try {
        const response = await fetch(`/api/admin/treks/${this.trekId}`, {
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          const trek = result.data.trek;

          this.form = {
            trekname: trek.trekname,
            location: trek.location,
            difficulty: trek.difficulty,
            duration: trek.duration,
            slots: trek.total_slots,
            start_date: trek.start_date,
            end_date: trek.end_date,
            staff_id: trek.assigned_staff,
            status: trek.status,
            description: trek.description
          };
        }
      } catch (err) {
        console.error(err);
      }
    },

    async saveTrek() {
      try {
        const url = this.trekId
          ? `/api/admin/treks/${this.trekId}`
          : "/api/admin/treks";

        const method = this.trekId ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify(this.form)
        });

        const result = await response.json();

        if (result.success) {
          this.$emit("navigate", "admin-treks");
        } else {
          alert(result.message || "Failed to save trek");
        }

      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
    },

    calculateEndDate() {
      if (!this.form.start_date || !this.form.duration) return;

      const start = new Date(this.form.start_date);
      const end = new Date(start);

      // Duration of 1 day means start and end are the same day
      end.setDate(start.getDate() + this.form.duration - 1);

      this.form.end_date = end.toISOString().split("T")[0];
    },

    calculateDuration() {
      if (!this.form.start_date || !this.form.end_date) return;

      const start = new Date(this.form.start_date);
      const end = new Date(this.form.end_date);

      const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

      if (diff > 0) {
        this.form.duration = diff;
      }
    },

    navigate(page) {
      this.$emit("navigate", page);
    },

    async logout() {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include"
        });
      } finally {
        this.$emit("logout");
      }
    }
  },

  template: `
    <AdminLayout
      active-page="treks"
      :admin-name="adminName"
      @navigate="navigate"
      @logout="logout"
    >
      <h2 class="mb-4">
        {{ trekId ? "Edit Trek" : "Add New Trek" }}
      </h2>

      <form @submit.prevent="saveTrek">

        <div class="row">

          <div class="col-md-6">

            <div class="mb-3">
              <label class="form-label">Trek Name</label>
              <input
                v-model="form.trekname"
                type="text"
                class="form-control"
                required
              >
            </div>

            <div class="mb-3">
              <label class="form-label">Location</label>
              <input
                v-model="form.location"
                type="text"
                class="form-control"
                required
              >
            </div>

            <div class="mb-3">
              <label class="form-label">Difficulty</label>
              <select
                v-model="form.difficulty"
                class="form-select"
                required
              >
                <option value="">Select Difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Duration (Days)</label>
              <input
                v-model.number="form.duration"
                @input="calculateEndDate"
                type="number"
                min="1"
                class="form-control"
                required
              >
            </div>

            <div class="mb-3">
              <label class="form-label">Total Slots</label>
              <input
                v-model.number="form.slots"
                type="number"
                min="1"
                class="form-control"
                required
              >
            </div>

          </div>

          <div class="col-md-6">

            <div class="mb-3">
              <label class="form-label">Start Date</label>
              <input
                v-model="form.start_date"
                @change="calculateEndDate"
                type="date"
                class="form-control"
                required
              >
            </div>

            <div class="mb-3">
              <label class="form-label">End Date</label>
              <input
                v-model="form.end_date"
                @change="calculateDuration"
                type="date"
                class="form-control"
                required
              >
            </div>

            <div class="mb-3">
              <label class="form-label">Assign Staff</label>
              <select
                v-model="form.staff_id"
                class="form-select"
                required
              >
                <option value="">Select Staff</option>
                <option
                  v-for="staff in staffList"
                  :key="staff.id"
                  :value="staff.id"
                >
                  {{ staff.name }}
                </option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Status</label>
              <select
                v-model="form.status"
                class="form-select"
                required
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Description</label>
              <textarea
                v-model="form.description"
                rows="4"
                class="form-control"
              ></textarea>
            </div>

          </div>

        </div>

        <div class="text-end mt-4">

          <button
            type="button"
            class="btn btn-secondary me-2"
            @click="navigate('admin-treks')"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="btn btn-primary"
          >
            {{ trekId ? "Save Changes" : "Save Trek" }}
          </button>

        </div>

      </form>

    </AdminLayout>
  `
};

window.AdminAddTrek = AdminAddTrek;