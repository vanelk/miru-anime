<template>
  <DefaultLayout :addScrollEvents="true">
    <div v-if="$apollo.loading">
      <ShimmerPageGrid />
    </div>
    <div v-else>
      <div class="pb-2">
        <TrailerBanner
          :trailer="homeFeed.banner_anime.trailer"
          :thumbnail="homeFeed.banner_anime.bannerImage"
        >
          <div class="banner_anime_info lg:w-1/2 px-14">
            <h1 class="text-5xl font-bold">
              {{ preferredTitle(homeFeed.banner_anime.title) }}
            </h1>
            <div class="mt-4">
              <TagBadge
                v-for="genre in homeFeed.banner_anime.genres"
                :key="genre"
                >{{ genre }}</TagBadge
              >
              <span class="dot" />
              <span class="text-lg text-bold">{{
                homeFeed.banner_anime.format
              }}</span>
              <span class="dot" />
              <span class="text-lg text-bold">{{
                homeFeed.banner_anime.seasonYear
              }}</span>
            </div>
            <p
              class="text-lg mt-2 line-clamp-6"
              v-html="`<span>${homeFeed.banner_anime.description}</span>`"
            />
            <div class="mt-3 flex gap-x-2">
              <router-link :to="'/details/' + homeFeed.banner_anime.id">
                <PrimaryButton>
                  <span class="flex items-center gap-x-2">
                    <BIconInfoCircle />
                    <span class="mr-2"> View Details </span>
                  </span>
                </PrimaryButton>
              </router-link>
              <WatchListButton
                :id="homeFeed.banner_anime.id"
                :title="preferredTitle(homeFeed.banner_anime.title)"
              />
            </div>
          </div>
        </TrailerBanner>
        <div class="main-container-fluid">
          <CategoryAnimeSlider
            categoryTitle="Recent Releases"
            :animes="recently_released_animes"
          />
          <CategoryAnimeSlider
            categoryTitle="Trending Now"
            :animes="homeFeed.trending_animes"
            viewAll="?collection=trending_now"
          />
          <CategoryAnimeSlider
            categoryTitle="Continue Watching"
            :animes="homeFeed.continue_watch_animes"
            :viewAll="
              continueWatchAnimes.length > feedLimit &&
              '?collection=continue_watch'
            "
          />
          <CategoryAnimeSlider
            categoryTitle="Upcoming Animes"
            :animes="homeFeed.upcoming_animes"
          />
          <CategoryAnimeSlider
            categoryTitle="Recommended"
            :animes="homeFeed.recommended"
          />
          <CategoryAnimeSlider
            categoryTitle="All Time Popular"
            :animes="homeFeed.popular_animes"
            viewAll="?collection=popular"
          />
          <CategoryAnimeSlider
            categoryTitle="Top Airing"
            :animes="homeFeed.top_airing"
            viewAll="?collection=top_airing"
          />
          <CategoryAnimeSlider
            categoryTitle="Anime Movies"
            :animes="homeFeed.anime_movies"
            viewAll="?collection=anime_movies"
          />
        </div>
      </div>
    </div>
  </DefaultLayout>
  <ConfirmDialogue ref="confirmDialogue" />
</template>

<script>
import config from "../config.json";
import { BIconInfoCircle } from "bootstrap-icons-vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import CategoryAnimeSlider from "@/components/CategoryAnimeSlider.vue";
import TagBadge from "@/components/TagBadge.vue";
import notificationStore from "@/stores/notificationStore";
import { sendEventAsync } from "@/libs/ipc-lib";
import { getRecentEpisodes } from "@/libs/anime-lib";
import {
  transformFields,
  preferredTitle,
  randomizeAndSlice,
} from "@/libs/utils-lib";
import WatchListButton from "@/components/WatchListButton.vue";
import TrailerBanner from "@/components/TrailerBanner.vue";
import ShimmerPageGrid from "@/components/ShimmerPageGrid.vue";
import ConfirmDialogue from "@/components/ConfirmDialogue.vue";
import { HOME_FEED_QUERY } from "@/apollo/queries";

export default {
  name: "HomeView",
  apollo: {
    homeFeed: {
      query: () => HOME_FEED_QUERY,
      variables() {
        let watchedIds = randomizeAndSlice(
          this.watchedAnimeIds,
          this.feedLimit
        );
        return {
          banned_formats: config.banned_formats,
          limit: this.feedLimit,
          recommendationMax: Math.max(
            5,
            Math.ceil(this.feedLimit / watchedIds.length)
          ),
          watchedIds,
          continueWatchIds: this.continueWatchAnimes.map(
            ({ animeId }) => animeId
          ),
        };
      },
      update(data) {
        let top_airing = data.top_airing.media.map(transformFields);
        let anime_movies = data.anime_movies.media.map(transformFields);
        let popular_animes = data.popular_animes.media.map(transformFields);
        let episodesObj = {};
        for (let anime of this.continueWatchAnimes) {
          episodesObj[anime.animeId] = {
            num: anime.episodeNumber,
            completed:
              anime.watchTime / anime.episodeDuration >=
              config.episode_watched_ratio,
          };
        }
        let continue_watch_animes = data.continue_watch_animes.media
          .map(transformFields)
          .filter(
            (anime) =>
              anime.status != "Ongoing" ||
              !episodesObj[anime.id].completed ||
              (anime.nextAiringEpisode &&
                anime.nextAiringEpisode.episode - episodesObj[anime.id].num >=
                  2)
          )
          .map((anime) => ({
            ...anime,
            removeWatchedAnime: this.removeWatchedAnime,
          }));
        let trending_animes = data.trending_animes.media.map(transformFields);
        let upcoming_animes = data.upcoming_animes.media.map(transformFields);
        let recommended = data.recommended_animes.media
          .reduce((rec_list, anime) => {
            return rec_list
              .concat(
                anime.recommendations.nodes.map(
                  ({ mediaRecommendation }) => transformFields(mediaRecommendation)
                )
              )
          }, [])
          .filter((anime) => !this.watchedAnimeIds.includes("" + anime.id));
        return {
          banner_anime: data.banner_anime,
          continue_watch_animes,
          top_airing,
          upcoming_animes,
          anime_movies,
          popular_animes,
          trending_animes,
          recommended,
        };
      },
    },
  },
  created() {
    this.getWatchedAnimes();
    this.getContinueWatchList();
    this.getRecentAnimeReleases();
  },
  data() {
    return {
      homeFeed: null,
      watchedAnimeIds: [],
      continueWatchAnimes: [],
      recently_released_animes: [],
      preferredTitle,
      feedLimit: config.feed_limit,
    };
  },
  components: {
    DefaultLayout,
    CategoryAnimeSlider,
    PrimaryButton,
    BIconInfoCircle,
    TagBadge,
    WatchListButton,
    TrailerBanner,
    ShimmerPageGrid,
    ConfirmDialogue,
  },
  methods: {
    getWatchedAnimes() {
      sendEventAsync("db:getWatchedAnimes").then((animes) => {
        this.watchedAnimeIds = animes.map(({ animeId }) => animeId);
      });
    },
    getContinueWatchList() {
      sendEventAsync("db:getContinueWatchAnimes").then((animes) => {
        this.continueWatchAnimes = animes;
      });
    },
    getRecentAnimeReleases() {
      getRecentEpisodes().then((data) => {
        this.recently_released_animes = data.results;
      });
    },
    removeWatchedAnime(id) {
      this.$refs.confirmDialogue
        .show(
          "You won't see this show in Continue Watching, and your watch progress will be reset. Are you sure you continue?"
        )
        .then(() => {
          sendEventAsync("db:removeWatchedAnime", id).then(() => {
            this.homeFeed.continue_watch_animes =
              this.homeFeed.continue_watch_animes.filter((a) => {
                if (a.id === id) {
                  notificationStore.setNotification(
                    `${preferredTitle(
                      a.title
                    )} has been removed from your Continue Watch`
                  );
                  return false;
                }
                return true;
              });
          });
        }).catch(()=>{});
    },
  },
};
</script>
