(ns theme-lab.preview)
;; Preview the active projects.
(def projects [{:name "eenei" :active true}])
(defn label [project]
  (if (:active project)
    (str "Project: " (:name project))
    "Archived"))
(doseq [project projects]
  (println (label project)))
