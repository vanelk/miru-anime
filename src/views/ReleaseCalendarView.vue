<template>
  <DefaultLayout>
    <div class="default-layout-main pt-4">
      <div class="grid grid-cols-7 gap-x-8 justify-between">
        <div v-for="(n,day) in 7" :key="n">
          <div class="text-lg">
            {{ formatDate(addDaysToDate(start, day)) }}
          </div>
          <div class="border-l border-l-gray-500 px-4">
            <div
              class="my-7 relative schedule-item"
              v-for="(schedule, index) in weekSchedule
                ?.filter((schedule) => schedule.airingAt.getDay() == day)
                ?.sort((schedule) => schedule.airingAt)
                .reverse()"
              :key="index"
            >
              <router-link :to="'/details/' + schedule.media.id">
                <div class="text-sm text-gray-500">
                  {{ formatTime(schedule.airingAt) }}
                </div>
                <div class="text-lg">
                  {{
                    schedule.media.title.english || schedule.media.title.romaji
                  }}
                </div>
                <div class="text-sm text-gray-500">
                  Episode {{ schedule.episode }}
                </div>
                <img :src="schedule.media.coverImage.medium" />
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
import config from "../config.json";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { getWeekAiringSchedule } from "../libs/anime-lib";
export default {
  data() {
    let today = new Date();
    let start = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    return {
      weekSchedule: [],
      start,
    };
  },
  mounted() {
    this.fetchAiringSchedule();
  },
  components: { DefaultLayout },
  methods: {
    fetchAiringSchedule() {
      getWeekAiringSchedule(
        this.start.getTime() / 1000,
        this.addDaysToDate(this.start, 7).getTime() / 1000
      ).then((schedules) => {
        this.weekSchedule = schedules
          .map((schedule) => {
            return {
              ...schedule,
              airingAt: new Date(schedule.airingAt * 1000),
            };
          })
          .filter(
            (schedule) =>
              !config.banned_formats.includes(schedule.media.format) &&
              !schedule.media.isAdult
          );
      });
    },
    addDaysToDate(date, days) {
      let nDate = new Date(date);
      nDate.setDate(nDate.getDate() + days);
      return nDate;
    },
    formatDate(date) {
      return date.toLocaleDateString("en-us", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
    formatTime(date) {
      return date.toLocaleTimeString("en-us", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
};
</script>

<style>
.schedule-item:before {
  content: "";
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-left: -18px;
  margin-top: 3px;
  @apply bg-gray-500 absolute;
}
.schedule-item img {
  position: absolute;
  height: 200px;
  @apply scale-0 w-auto min-w-[50px] z-10 rounded;
  top: 0;
  left: 80%;
}
.schedule-item:hover img {
  @apply scale-100;
}
.schedule-item:hover::before {
  @apply bg-blue-500;
}
</style>