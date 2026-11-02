(defpackage :theme-lab (:use :cl))
(in-package :theme-lab)
;; Preview the active projects.
(defun label (name active)
  (if active
      (concatenate 'string "Project: " name)
      "Archived"))
(format t "~a~%" (label "eenei" t))
