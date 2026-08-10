const StatsCardsComponent = {
  props: {
    cards: Array
  },

  template: `
    <div class="row mb-4">

      <div
        class="col-md-3 mb-3"
        v-for="card in cards"
        :key="card.title"
      >

        <div class="card shadow-sm h-100">

          <div class="card-body d-flex justify-content-between align-items-center">

            <div>

              <small class="text-muted text-uppercase">
                {{ card.title }}
              </small>

              <h2 class="mb-0">
                {{ card.value }}
              </h2>

            </div>

            <div class="text-primary">
              <i
                :class="'bi ' + card.icon + ' fs-3'"
              ></i>
            </div>

          </div>

        </div>

      </div>

    </div>
  `
};

window.StatsCardsComponent = StatsCardsComponent;