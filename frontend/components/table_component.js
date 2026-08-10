const TableComponent = {
  props: {
    headers: {
      type: Array,
      required: true
    },

    keys: {
      type: Array,
      required: true
    },

    data: {
      type: Array,
      default: () => []
    }
  },

  methods: {

    badgeClass(value) {

      if (!value) return "bg-secondary";

      const v = value.toLowerCase();

      if (["open", "approved", "booked"].includes(v)) {
        return "bg-success";
      }

      if (["closed", "blacklisted", "cancelled", "rejected"].includes(v)) {
        return "bg-danger";
      }

      return "bg-secondary";

    }

  },

  template: `
    <div class="card shadow-sm">

      <div class="table-responsive">

        <table class="table table-hover align-middle mb-0">

          <thead class="table-light">

            <tr>

              <th
                v-for="header in headers"
                :key="header"
                :class="{ 'text-center': header === 'Action' || header === 'Actions' }"
              >
                {{ header }}
              </th>

            </tr>

          </thead>

          <tbody>

            <tr
              v-for="(item, index) in data"
              :key="index"
            >

              <td
                v-for="key in keys"
                :key="key"
                :class="{ 'font-monospace': key === keys[0] }"
              >

                <!-- Custom action buttons -->
                <template v-if="key === 'actions'">

                  <div class="d-flex justify-content-center">

                    <slot
                      name="actions"
                      :item="item"
                    ></slot>

                  </div>

                </template>

                <!-- Status badges -->
                <template v-else-if="key === 'status' || key === 'approval_status'">

                  <span
                    class="badge"
                    :class="badgeClass(item[key])"
                  >
                    {{ item[key] }}
                  </span>

                </template>

                <!-- Normal values -->
                <template v-else>

                  {{ item[key] }}

                </template>

              </td>

            </tr>

            <tr v-if="!data || data.length === 0">

              <td
                :colspan="headers.length"
                class="text-center"
              >
                No records found.
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>
  `
};

window.TableComponent = TableComponent;