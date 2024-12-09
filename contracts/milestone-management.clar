;; milestone-management contract

(define-map milestones
  { project-id: uint, milestone-id: uint }
  {
    creator: principal,
    description: (string-utf8 500),
    funds-required: uint,
    deadline: uint,
    status: (string-ascii 20)
  }
)

(define-map project-milestones
  { project-id: uint }
  { milestone-count: uint }
)

(define-constant contract-owner tx-sender)

(define-constant ERR-UNAUTHORIZED u401)
(define-constant ERR-INVALID-PROJECT u402)
(define-constant ERR-INVALID-MILESTONE u403)

(define-public (create-milestone (project-id uint) (description (string-utf8 500)) (funds-required uint) (deadline uint))
  (let
    (
      (milestone-data (default-to { milestone-count: u0 } (map-get? project-milestones { project-id: project-id })))
      (new-milestone-id (get milestone-count milestone-data))
    )
    (asserts! (is-eq tx-sender contract-owner) (err ERR-UNAUTHORIZED))
    (map-set milestones
      { project-id: project-id, milestone-id: new-milestone-id }
      {
        creator: tx-sender,
        description: description,
        funds-required: funds-required,
        deadline: deadline,
        status: "pending"
      }
    )
    (map-set project-milestones
      { project-id: project-id }
      { milestone-count: (+ new-milestone-id u1) }
    )
    (ok new-milestone-id)
  )
)

(define-public (complete-milestone (project-id uint) (milestone-id uint))
  (let
    (
      (milestone (unwrap! (map-get? milestones { project-id: project-id, milestone-id: milestone-id }) (err ERR-INVALID-MILESTONE)))
    )
    (asserts! (is-eq tx-sender contract-owner) (err ERR-UNAUTHORIZED))
    (asserts! (is-eq (get status milestone) "pending") (err ERR-INVALID-MILESTONE))
    (ok (map-set milestones
      { project-id: project-id, milestone-id: milestone-id }
      (merge milestone { status: "completed" })
    ))
  )
)

(define-read-only (get-milestone (project-id uint) (milestone-id uint))
  (map-get? milestones { project-id: project-id, milestone-id: milestone-id })
)

(define-read-only (get-project-milestones (project-id uint))
  (map-get? project-milestones { project-id: project-id })
)

